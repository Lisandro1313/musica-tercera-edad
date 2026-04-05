import { useState, useEffect, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { documentDirectory, downloadAsync } from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Cancion, getArchivosMp3 } from '../utils/archiveApi';

export type EstadoReproductor = 'parado' | 'cargando' | 'reproduciendo' | 'pausado';

export function useReproductor() {
  const soundRef = useRef<Audio.Sound | null>(null);
  const sleepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [estado, setEstado] = useState<EstadoReproductor>('parado');
  const [cancionActual, setCancionActual] = useState<Cancion | null>(null);
  const [progreso, setProgreso] = useState(0);
  const [duracion, setDuracion] = useState(0);
  const [lista, setLista] = useState<Cancion[]>([]);
  const [indice, setIndice] = useState(0);
  const [descargadas, setDescargadas] = useState<Record<string, string>>({});
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [favoritos, setFavoritos] = useState<Cancion[]>([]);
  const [sleepRestante, setSleepRestante] = useState<number | null>(null);

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
    });
    AsyncStorage.getItem('canciones_descargadas').then(raw => { if (raw) setDescargadas(JSON.parse(raw)); });
    AsyncStorage.getItem('musica_favoritos').then(raw => { if (raw) setFavoritos(JSON.parse(raw)); });
    return () => {
      soundRef.current?.unloadAsync();
      if (sleepIntervalRef.current) clearInterval(sleepIntervalRef.current);
    };
  }, []);

  const toggleFavorito = useCallback(async (cancion: Cancion) => {
    setFavoritos(prev => {
      const existe = prev.find(f => f.id === cancion.id);
      const nuevos = existe ? prev.filter(f => f.id !== cancion.id) : [...prev, cancion];
      AsyncStorage.setItem('musica_favoritos', JSON.stringify(nuevos));
      return nuevos;
    });
  }, []);

  const esFavorito = useCallback((id: string) => favoritos.some(f => f.id === id), [favoritos]);

  const reproducir = async (cancion: Cancion, listaNueva?: Cancion[], idx?: number) => {
    try {
      setEstado('cargando');
      setCancionActual(cancion);
      const listaFinal = listaNueva ?? lista;
      const idxFinal = idx ?? indice;
      if (listaNueva) { setLista(listaNueva); setIndice(idxFinal); }

      await soundRef.current?.unloadAsync();
      let uri = descargadas[cancion.id];
      if (!uri) {
        const urlMp3 = await getArchivosMp3(cancion.id);
        if (!urlMp3) { setEstado('parado'); return; }
        uri = urlMp3;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, progressUpdateIntervalMillis: 1000 },
        (status) => {
          if (!status.isLoaded) return;
          setProgreso(status.positionMillis ?? 0);
          setDuracion(status.durationMillis ?? 0);
          if (status.didJustFinish) {
            if (repeat) {
              sound.replayAsync();
            } else {
              const nextIdx = shuffle
                ? Math.floor(Math.random() * listaFinal.length)
                : (idxFinal + 1) % listaFinal.length;
              setIndice(nextIdx);
              reproducir(listaFinal[nextIdx], listaFinal, nextIdx);
            }
          }
        }
      );
      soundRef.current = sound;
      setEstado('reproduciendo');
    } catch {
      setEstado('parado');
    }
  };

  const pausar = async () => { await soundRef.current?.pauseAsync(); setEstado('pausado'); };
  const reanudar = async () => { await soundRef.current?.playAsync(); setEstado('reproduciendo'); };

  const siguienteCancion = () => {
    if (!lista.length) return;
    const nuevoIdx = shuffle ? Math.floor(Math.random() * lista.length) : (indice + 1) % lista.length;
    setIndice(nuevoIdx);
    reproducir(lista[nuevoIdx], lista, nuevoIdx);
  };

  const anteriorCancion = () => {
    if (!lista.length) return;
    const nuevoIdx = (indice - 1 + lista.length) % lista.length;
    setIndice(nuevoIdx);
    reproducir(lista[nuevoIdx], lista, nuevoIdx);
  };

  const descargar = async (cancion: Cancion): Promise<boolean> => {
    try {
      const urlMp3 = await getArchivosMp3(cancion.id);
      if (!urlMp3) return false;
      const ruta = `${documentDirectory ?? ''}musica_${cancion.id}.mp3`;
      await downloadAsync(urlMp3, ruta);
      const nuevas = { ...descargadas, [cancion.id]: ruta };
      setDescargadas(nuevas);
      await AsyncStorage.setItem('canciones_descargadas', JSON.stringify(nuevas));
      return true;
    } catch { return false; }
  };

  const activarSleepTimer = (minutos: number) => {
    if (sleepIntervalRef.current) clearInterval(sleepIntervalRef.current);
    setSleepRestante(minutos * 60);
    sleepIntervalRef.current = setInterval(() => {
      setSleepRestante(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(sleepIntervalRef.current!);
          soundRef.current?.pauseAsync();
          setEstado('pausado');
          setSleepRestante(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelarSleep = () => {
    if (sleepIntervalRef.current) clearInterval(sleepIntervalRef.current);
    setSleepRestante(null);
  };

  const estaDescargada = (id: string) => !!descargadas[id];
  const buscarEnPosicion = async (ms: number) => { await soundRef.current?.setPositionAsync(ms); };

  return {
    estado, cancionActual, progreso, duracion, lista, indice,
    reproducir, pausar, reanudar, siguienteCancion, anteriorCancion,
    descargar, estaDescargada, buscarEnPosicion,
    shuffle, setShuffle, repeat, setRepeat,
    favoritos, toggleFavorito, esFavorito,
    sleepRestante, activarSleepTimer, cancelarSleep,
  };
}
