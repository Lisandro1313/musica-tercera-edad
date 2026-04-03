import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, Alert,
} from 'react-native';
import { buscarCanciones, Cancion, Categoria } from '../utils/archiveApi';
import { useReproductor } from '../hooks/useReproductor';

interface Props {
  query: string;
  categoriaActiva: Categoria | null;
  reproductor: ReturnType<typeof useReproductor>;
  onVolver: () => void;
}

export default function ListaScreen({ query, categoriaActiva, reproductor, onVolver }: Props) {
  const [canciones, setCanciones] = useState<Cancion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [descargando, setDescargando] = useState<string | null>(null);

  const { reproducir, descargar, estaDescargada, cancionActual, estado } = reproductor;

  useEffect(() => {
    setCargando(true);
    buscarCanciones(query)
      .then(setCanciones)
      .catch(() => setCanciones([]))
      .finally(() => setCargando(false));
  }, [query]);

  const handleDescargar = async (cancion: Cancion) => {
    setDescargando(cancion.id);
    const ok = await descargar(cancion);
    setDescargando(null);
    if (!ok) Alert.alert('Error', 'No se pudo descargar la canción');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onVolver} style={styles.btnVolver}>
          <Text style={styles.btnVolverText}>‹ Volver</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitulo}>
            {categoriaActiva ? `${categoriaActiva.emoji} ${categoriaActiva.label}` : `🔍 "${query}"`}
          </Text>
          {!cargando && <Text style={styles.headerCount}>{canciones.length} canciones</Text>}
        </View>
      </View>

      {cargando ? (
        <View style={styles.centrado}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.cargandoTexto}>Buscando música...</Text>
        </View>
      ) : canciones.length === 0 ? (
        <View style={styles.centrado}>
          <Text style={styles.vacioemoji}>🎵</Text>
          <Text style={styles.vacioTexto}>No encontramos canciones</Text>
        </View>
      ) : (
        <FlatList
          data={canciones}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 160 }}
          renderItem={({ item, index }) => {
            const activa = cancionActual?.id === item.id;
            const descargada = estaDescargada(item.id);
            return (
              <TouchableOpacity
                style={[styles.cancionItem, activa && styles.cancionItemActiva]}
                onPress={() => reproducir(item, canciones, index)}
              >
                <View style={styles.cancionNumero}>
                  {activa && estado === 'reproduciendo' ? (
                    <Text style={styles.cancionNumeroActiva}>▶</Text>
                  ) : (
                    <Text style={styles.cancionNumeroText}>{index + 1}</Text>
                  )}
                </View>
                <View style={styles.cancionInfo}>
                  <Text style={[styles.cancionTitulo, activa && styles.cancionTituloActiva]} numberOfLines={1}>
                    {item.titulo}
                  </Text>
                  <Text style={styles.cancionArtista} numberOfLines={1}>{item.artista}</Text>
                </View>
                <Text style={styles.cancionDuracion}>{item.duracion}</Text>
                <TouchableOpacity
                  style={styles.btnDescarga}
                  onPress={() => !descargada && handleDescargar(item)}
                  disabled={descargada || descargando === item.id}
                >
                  {descargando === item.id ? (
                    <ActivityIndicator size="small" color="#FFD700" />
                  ) : (
                    <Text style={styles.btnDescargaText}>{descargada ? '✅' : '⬇️'}</Text>
                  )}
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d1a' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#1a1a2e',
  },
  btnVolver: { paddingRight: 16, paddingVertical: 8 },
  btnVolverText: { color: '#FFD700', fontSize: 18, fontWeight: '600' },
  headerInfo: { flex: 1 },
  headerTitulo: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerCount: { color: '#666', fontSize: 13, marginTop: 2 },
  centrado: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  cargandoTexto: { color: '#888', fontSize: 16 },
  vacioemoji: { fontSize: 60 },
  vacioTexto: { color: '#888', fontSize: 18 },
  cancionItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#161b22',
  },
  cancionItemActiva: { backgroundColor: '#FFD70011' },
  cancionNumero: { width: 32, alignItems: 'center' },
  cancionNumeroText: { color: '#555', fontSize: 15 },
  cancionNumeroActiva: { color: '#FFD700', fontSize: 18 },
  cancionInfo: { flex: 1, marginHorizontal: 12 },
  cancionTitulo: { color: '#ccc', fontSize: 16, fontWeight: '500' },
  cancionTituloActiva: { color: '#FFD700', fontWeight: '700' },
  cancionArtista: { color: '#666', fontSize: 13, marginTop: 3 },
  cancionDuracion: { color: '#555', fontSize: 13, marginRight: 8 },
  btnDescarga: { padding: 8 },
  btnDescargaText: { fontSize: 20 },
});
