import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useReproductor } from '../hooks/useReproductor';

interface Props {
  reproductor: ReturnType<typeof useReproductor>;
}

const OPCIONES_SLEEP = [
  { label: '15 min', min: 15 },
  { label: '30 min', min: 30 },
  { label: '45 min', min: 45 },
  { label: '1 hora', min: 60 },
  { label: '2 horas', min: 120 },
];

function formatSleep(seg: number) {
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function ReproductorBar({ reproductor }: Props) {
  const {
    estado, cancionActual, progreso, duracion,
    pausar, reanudar, siguienteCancion, anteriorCancion,
    shuffle, setShuffle, repeat, setRepeat,
    toggleFavorito, esFavorito,
    sleepRestante, activarSleepTimer, cancelarSleep,
  } = reproductor;

  const [mostrarSleep, setMostrarSleep] = useState(false);

  if (!cancionActual || estado === 'parado') return null;

  const pct = duracion > 0 ? (progreso / duracion) * 100 : 0;
  const esFav = esFavorito(cancionActual.id);

  return (
    <>
      <View style={styles.container}>
        <View style={styles.barraContainer}>
          <View style={[styles.barra, { width: `${pct}%` as any }]} />
        </View>

        <View style={styles.contenido}>
          <View style={styles.infoCancion}>
            <TouchableOpacity onPress={() => toggleFavorito(cancionActual)}>
              <Text style={styles.favIcon}>{esFav ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>
            <View style={styles.textoContainer}>
              <Text style={styles.titulo} numberOfLines={1}>{cancionActual.titulo}</Text>
              <Text style={styles.artista} numberOfLines={1}>{cancionActual.artista}</Text>
            </View>
          </View>

          <View style={styles.controles}>
            <TouchableOpacity style={styles.ctrlBtn} onPress={anteriorCancion}>
              <Text style={styles.ctrlText}>⏮</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.playBtn} onPress={estado === 'reproduciendo' ? pausar : reanudar}>
              <Text style={styles.playText}>
                {estado === 'cargando' ? '⏳' : estado === 'reproduciendo' ? '⏸' : '▶'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ctrlBtn} onPress={siguienteCancion}>
              <Text style={styles.ctrlText}>⏭</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.extrasRow}>
          <TouchableOpacity
            style={[styles.extraBtn, shuffle && styles.extraBtnActivo]}
            onPress={() => setShuffle(!shuffle)}
          >
            <Text style={styles.extraBtnText}>🔀 Aleatorio</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.extraBtn, repeat && styles.extraBtnActivo]}
            onPress={() => setRepeat(!repeat)}
          >
            <Text style={styles.extraBtnText}>🔁 Repetir</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.extraBtn, sleepRestante !== null && styles.extraBtnSleep]}
            onPress={() => sleepRestante !== null ? cancelarSleep() : setMostrarSleep(true)}
          >
            <Text style={styles.extraBtnText}>
              {sleepRestante !== null ? `😴 ${formatSleep(sleepRestante)}` : '😴 Sleep'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={mostrarSleep} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitulo}>😴 Sleep Timer</Text>
            <Text style={styles.modalSub}>La música se apaga automáticamente</Text>
            <View style={styles.sleepOpciones}>
              {OPCIONES_SLEEP.map(op => (
                <TouchableOpacity
                  key={op.min}
                  style={styles.sleepOpcion}
                  onPress={() => { activarSleepTimer(op.min); setMostrarSleep(false); }}
                >
                  <Text style={styles.sleepOpcionText}>{op.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.modalBtnCancelar} onPress={() => setMostrarSleep(false)}>
              <Text style={{ color: '#888' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#1a1a2e', borderTopWidth: 1, borderTopColor: '#FFD70033' },
  barraContainer: { height: 3, backgroundColor: '#21262d' },
  barra: { height: '100%', backgroundColor: '#FFD700' },
  contenido: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
  infoCancion: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  favIcon: { fontSize: 22 },
  textoContainer: { flex: 1 },
  titulo: { color: '#fff', fontSize: 14, fontWeight: '600' },
  artista: { color: '#888', fontSize: 12, marginTop: 1 },
  controles: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ctrlBtn: { padding: 6 },
  ctrlText: { fontSize: 20, color: '#ccc' },
  playBtn: { backgroundColor: '#FFD700', borderRadius: 20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  playText: { fontSize: 18, color: '#000' },
  extrasRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 10 },
  extraBtn: { flex: 1, backgroundColor: '#21262d', borderRadius: 10, paddingVertical: 7, alignItems: 'center', borderWidth: 1, borderColor: '#30363d' },
  extraBtnActivo: { backgroundColor: '#FFD70022', borderColor: '#FFD700' },
  extraBtnSleep: { backgroundColor: '#4FC3F722', borderColor: '#4FC3F7' },
  extraBtnText: { color: '#aaa', fontSize: 11, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#1a1a2e', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitulo: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 4 },
  modalSub: { color: '#888', fontSize: 13, marginBottom: 20 },
  sleepOpciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  sleepOpcion: { backgroundColor: '#21262d', borderRadius: 14, paddingHorizontal: 20, paddingVertical: 14, borderWidth: 1, borderColor: '#30363d', minWidth: '28%', alignItems: 'center' },
  sleepOpcionText: { color: '#FFD700', fontWeight: '700', fontSize: 15 },
  modalBtnCancelar: { backgroundColor: '#21262d', borderRadius: 12, padding: 14, alignItems: 'center' },
});
