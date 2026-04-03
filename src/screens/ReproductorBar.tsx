import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useReproductor } from '../hooks/useReproductor';

interface Props {
  reproductor: ReturnType<typeof useReproductor>;
}

export default function ReproductorBar({ reproductor }: Props) {
  const {
    estado, cancionActual, progreso, duracion,
    pausar, reanudar, siguienteCancion, anteriorCancion,
  } = reproductor;

  if (!cancionActual || estado === 'parado') return null;

  const pct = duracion > 0 ? (progreso / duracion) * 100 : 0;

  return (
    <View style={styles.container}>
      {/* Barra de progreso */}
      <View style={styles.barraContainer}>
        <View style={[styles.barra, { width: `${pct}%` as any }]} />
      </View>

      <View style={styles.contenido}>
        {/* Info canción */}
        <View style={styles.infoCancion}>
          <Text style={styles.nota}>{estado === 'reproduciendo' ? '▶' : '⏸'}</Text>
          <View style={styles.textoContainer}>
            <Text style={styles.titulo} numberOfLines={1}>{cancionActual.titulo}</Text>
            <Text style={styles.artista} numberOfLines={1}>{cancionActual.artista}</Text>
          </View>
        </View>

        {/* Controles */}
        <View style={styles.controles}>
          <TouchableOpacity style={styles.ctrlBtn} onPress={anteriorCancion}>
            <Text style={styles.ctrlText}>⏮</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.playBtn}
            onPress={estado === 'reproduciendo' ? pausar : reanudar}
          >
            <Text style={styles.playText}>
              {estado === 'cargando' ? '⏳' : estado === 'reproduciendo' ? '⏸' : '▶'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ctrlBtn} onPress={siguienteCancion}>
            <Text style={styles.ctrlText}>⏭</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a2e',
    borderTopWidth: 1, borderTopColor: '#FFD70033',
  },
  barraContainer: {
    height: 3, backgroundColor: '#21262d',
  },
  barra: { height: '100%', backgroundColor: '#FFD700' },
  contenido: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  infoCancion: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  nota: { fontSize: 16, color: '#FFD700' },
  textoContainer: { flex: 1 },
  titulo: { color: '#fff', fontSize: 15, fontWeight: '600' },
  artista: { color: '#888', fontSize: 13, marginTop: 2 },
  controles: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ctrlBtn: { padding: 8 },
  ctrlText: { fontSize: 22, color: '#ccc' },
  playBtn: {
    backgroundColor: '#FFD700', borderRadius: 22,
    width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
  },
  playText: { fontSize: 20, color: '#000' },
});
