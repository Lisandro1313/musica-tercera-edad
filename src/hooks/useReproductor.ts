import { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { documentDirectory, downloadAsync } from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Cancion, getArchivosMp3 } from '../utils/archiveApi';

export type EstadoReproductor = 'parado' | 'cargando' | 'reproduciendo' | 'pausado';

export function useReproductor() {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [estado, setEstado] = useState<EstadoReproductor>('parado');
  const [cancionActual, setCancionActual] = useState<Cancion | null>(null);
  const [progreso, setProgreso] = useState(0);
  const [duracion, setDuracion] = useState(0);
  const [lista, setLista] = useState<Cancion[]>([]);
  const [indice, setIndice] = useState(0);
  const [descargadas, setDescargadas] = useState<Record<string, string>>({});

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
    });
    cargarDescargadas();
    return () => { soundRef.current?.unloadAsync(); };
  }, []);

  const cargarDescargadas = async () => {
    const raw = await AsyncStorage.getItem('canciones_descargadas');
    if (raw) setDescargadas(JSON.parse(raw));
  };

  const reproducir = async (cancion: Cancion, listaNueva?: Cancion[], idx?: number) => {
    try {
      setEstado('cargando');
      setCancionActual(cancion);
      if (listaNueva) { setLista(listaNueva); setIndice(idx ?? 0); }

      await soundRef.current?.unloadAsync();

      // Ver si está descargada
      let uri = descargadas[cancion.id];

      if (!uri) {
        // Buscar URL real del mp3
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
          if (status.didJustFinish) siguienteCancion();
        }
      );
      soundRef.current = sound;
      setEstado('reproduciendo');
    } catch {
      setEstado('parado');
    }
  };

  const pausar = async () => {
    await soundRef.current?.pauseAsync();
    setEstado('pausado');
  };

  const reanudar = async () => {
    await soundRef.current?.playAsync();
    setEstado('reproduciendo');
  };

  const siguienteCancion = () => {
    if (!lista.length) return;
    const nuevoIdx = (indice + 1) % lista.length;
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
    } catch {
      return false;
    }
  };

  const estaDescargada = (id: string) => !!descargadas[id];

  const buscarEnPosicion = async (ms: number) => {
    await soundRef.current?.setPositionAsync(ms);
  };

  return {
    estado, cancionActual, progreso, duracion,
    lista, indice, reproducir, pausar, reanudar,
    siguienteCancion, anteriorCancion, descargar,
    estaDescargada, buscarEnPosicion,
  };
}
