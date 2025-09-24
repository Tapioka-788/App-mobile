import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';

import * as Database from './services/Database';
import Formulario from './components/Formulario';
import ListaRegistros from './components/ListaRegistros';
import Grafico from './components/Grafico';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';


export default function App() {
  const [registros, setRegistros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [ordenacao, setOrdenacao] = useState('recentes');

  useEffect(() => {
    const init = async () => {
      const dados = await Database.carregarDados();
      setRegistros(dados);
      setCarregando(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (!carregando) {
      Database.salvarDados(registros);
    }
  }, [registros, carregando]);

  const handleSave = (coposAgua, minutosExercicio, calorias) => {
    const aguaNum = parseFloat(String(coposAgua).replace(',', '.'));
    const exercicioNum = parseFloat(String(minutosExercicio).replace(',', '.'));
    const caloriasNum = parseFloat(String(calorias).replace(',', '.'));

    // Desafio 1: Validar Dados de Entrada
    if (aguaNum < 0 || exercicioNum < 0 || caloriasNum < 0 || isNaN(aguaNum) || isNaN(exercicioNum) || isNaN(caloriasNum)) {
      return Alert.alert("Erro de Validação", "Todos os valores devem ser números positivos. Por favor, corrija.");
    }

    if (editingId) {
      const registrosAtualizados = registros.map(reg =>
        reg.id === editingId ? { ...reg, agua: aguaNum, exercicio: exercicioNum, calorias: caloriasNum } : reg
      );
      setRegistros(registrosAtualizados);
    } else {
      // Desafio 2: Adicionar a Data do Registro
      const novoRegistro = {
        id: new Date().getTime(),
        data: new Date().toLocaleDateString('pt-BR'),
        agua: aguaNum,
        exercicio: exercicioNum,
        calorias: caloriasNum,
      };
      setRegistros([...registros, novoRegistro]);
    }
    setEditingId(null);

    // Desafio 3: Mensagens de Feedback
    Alert.alert('Sucesso!', 'Seu registro foi salvo!');
  };

  const handleDelete = (id) => {
    setRegistros(registros.filter(reg => reg.id !== id));
    // Desafio 3: Mensagens de Feedback
    Alert.alert('Sucesso!', 'O registro foi deletado.');
  };

  const handleEdit = (registro) => {
    setEditingId(registro.id);
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const exportarDados = async () => {
    const fileUri = Database.fileUri; // Usando a variável exportada se disponível, senão recriar
    if (Platform.OS === 'web') {
      const jsonString = JSON.stringify(registros, null, 2);
      if (registros.length === 0) {
        return Alert.alert("Aviso", "Nenhum dado para exportar.");
      }
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dados.json';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        return Alert.alert("Aviso", "Nenhum dado para exportar.");
      }
      if (!(await Sharing.isAvailableAsync())) {
        return Alert.alert("Erro", "Compartilhamento não disponível.");
      }
      await Sharing.shareAsync(fileUri);
    }
  };

  // Lógica de ordenação
  let registrosExibidos = [...registros];
  if (ordenacao === 'maior_agua') {
    registrosExibidos.sort((a, b) => b.agua - a.agua);
  } else if (ordenacao === 'maior_exercicio') {
    registrosExibidos.sort((a, b) => b.exercicio - a.exercicio);
  } else if (ordenacao === 'maior_calorias') {
    registrosExibidos.sort((a, b) => b.calorias - a.calorias);
  } else {
    registrosExibidos.sort((a, b) => b.id - a.id);
  }
  
  if (carregando) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#2ecc71" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.titulo}>Meu Diário Fit 💪</Text>
        <Text style={styles.subtituloApp}>App Componentizado</Text>
        
        <Formulario
          onSave={handleSave}
          onCancel={handleCancel}
          registroEmEdicao={registros.find(r => r.id === editingId) || null}
        />
        
        <Grafico registros={registrosExibidos} tipo="agua" unidade="copos" />
        <Grafico registros={registrosExibidos} tipo="exercicio" unidade="min" />
        <Grafico registros={registrosExibidos} tipo="calorias" unidade="kcal" />

        <View style={styles.card}>
            <Text style={styles.subtitulo}>Filtros e Ordenação</Text>
            <View style={styles.containerBotoesOrdenacao}>
                <TouchableOpacity
                    style={[styles.botaoOrdenacao, ordenacao === 'recentes' && styles.botaoOrdenacaoAtivo]}
                    onPress={() => setOrdenacao('recentes')}
                >
                    <Text style={styles.textoBotaoOrdenacao}>Mais Recentes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.botaoOrdenacao, ordenacao === 'maior_agua' && styles.botaoOrdenacaoAtivo]}
                    onPress={() => setOrdenacao('maior_agua')}
                >
                    <Text style={styles.textoBotaoOrdenacao}>Mais Água</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.botaoOrdenacao, ordenacao === 'maior_exercicio' && styles.botaoOrdenacaoAtivo]}
                    onPress={() => setOrdenacao('maior_exercicio')}
                >
                    <Text style={styles.textoBotaoOrdenacao}>Mais Exercício</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.botaoOrdenacao, ordenacao === 'maior_calorias' && styles.botaoOrdenacaoAtivo]}
                    onPress={() => setOrdenacao('maior_calorias')}
                >
                    <Text style={styles.textoBotaoOrdenacao}>Mais Calorias</Text>
                </TouchableOpacity>
            </View>
        </View>

        <ListaRegistros
          registros={registrosExibidos}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        <View style={styles.card}>
          <Text style={styles.subtitulo}>Exportar "Banco de Dados"</Text>
          <TouchableOpacity style={styles.botaoExportar} onPress={exportarDados}>
            <Text style={styles.botaoTexto}>Exportar arquivo dados.json</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'android' ? 25 : 0, backgroundColor: '#e0f7fa' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  titulo: { fontSize: 30, fontWeight: 'bold', textAlign: 'center', marginVertical: 20, color: '#00796b' },
  subtituloApp: { textAlign: 'center', fontSize: 18, color: '#444', marginTop: -20, marginBottom: 20, fontStyle: 'italic' },
  card: { backgroundColor: 'white', borderRadius: 10, padding: 20, marginHorizontal: 15, marginBottom: 20, elevation: 5 },
  subtitulo: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, color: '#2c3e50' },
  botaoExportar: { backgroundColor: '#2980b9', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  botaoTexto: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  containerBotoesOrdenacao: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginVertical: 10, gap: 10 },
  botaoOrdenacao: { backgroundColor: '#3498db', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20 },
  botaoOrdenacaoAtivo: { backgroundColor: '#2980b9' },
  textoBotaoOrdenacao: { color: 'white', fontSize: 14, fontWeight: 'bold' },
});