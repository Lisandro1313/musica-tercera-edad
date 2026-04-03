import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput,
} from 'react-native';
import Voice, { SpeechResultsEvent } from '@react-native-voice/voice';
import { CATEGORIAS, Categoria } from '../utils/archiveApi';

interface Props {
  onBuscar: (query: string) => void;
  onCategoria: (cat: Categoria) => void;
}

export default function InicioScreen({ onBuscar, onCategoria }: Props) {
  const [texto, setTexto] = useState('');
  const [escuchando, setEscuchando] = useState(false);

  const iniciarVoz = async () => {
    try {
      setEscuchando(true);
      Voice.onSpeechResults = (e: SpeechResultsEvent) => {
        const resultado = e.value?.[0] ?? '';
        setTexto(resultado);
        setEscuchando(false);
        Voice.destroy();
        if (resultado) onBuscar(resultado);
      };
      Voice.onSpeechError = () => { setEscuchando(false); Voice.destroy(); };
      await Voice.start('es-AR');
    } catch {
      setEscuchando(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.titulo}>🎵 MUSIC+</Text>
      <Text style={styles.subtitulo}>Tu música favorita, fácil</Text>

      {/* Buscador */}
      <View style={styles.buscadorCard}>
        <View style={styles.buscadorRow}>
          <TextInput
            style={styles.input}
            placeholder="Buscar canción o artista..."
            placeholderTextColor="#999"
            value={texto}
            onChangeText={setTexto}
            onSubmitEditing={() => texto && onBuscar(texto)}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.btnBuscar} onPress={() => texto && onBuscar(texto)}>
            <Text style={styles.btnBuscarText}>🔍</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.btnVoz, escuchando && styles.btnVozActivo]}
          onPress={iniciarVoz}
        >
          <Text style={styles.btnVozText}>
            {escuchando ? '🔴  Escuchando...' : '🎙️  Buscar por voz'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Categorías */}
      <Text style={styles.seccionTitulo}>¿Qué querés escuchar?</Text>
      <View style={styles.categoriasGrid}>
        {CATEGORIAS.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.catBtn, { backgroundColor: cat.color }]}
            onPress={() => onCategoria(cat)}
          >
            <Text style={styles.catEmoji}>{cat.emoji}</Text>
            <Text style={styles.catLabel}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d1a' },
  content: { padding: 20, paddingBottom: 40 },
  titulo: {
    fontSize: 36, fontWeight: 'bold', color: '#FFD700',
    textAlign: 'center', marginTop: 20,
  },
  subtitulo: {
    fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 28,
  },
  buscadorCard: {
    backgroundColor: '#161b22', borderRadius: 20, padding: 16, marginBottom: 28,
  },
  buscadorRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  input: {
    flex: 1, backgroundColor: '#21262d', borderRadius: 14,
    paddingHorizontal: 18, paddingVertical: 16,
    fontSize: 18, color: '#fff', borderWidth: 1, borderColor: '#30363d',
  },
  btnBuscar: {
    backgroundColor: '#FFD700', borderRadius: 14,
    paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center',
  },
  btnBuscarText: { fontSize: 24 },
  btnVoz: {
    backgroundColor: '#21262d', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
    borderWidth: 1, borderColor: '#30363d',
  },
  btnVozActivo: { backgroundColor: '#E74C3C22', borderColor: '#E74C3C' },
  btnVozText: { color: '#FFD700', fontSize: 17, fontWeight: '600' },
  seccionTitulo: {
    fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 16,
  },
  categoriasGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
  },
  catBtn: {
    width: '47%', borderRadius: 20, padding: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  catEmoji: { fontSize: 40, marginBottom: 8 },
  catLabel: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
