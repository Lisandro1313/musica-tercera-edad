import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useReproductor } from './src/hooks/useReproductor';
import InicioScreen from './src/screens/InicioScreen';
import ListaScreen from './src/screens/ListaScreen';
import ReproductorBar from './src/screens/ReproductorBar';
import { Categoria } from './src/utils/archiveApi';

type Vista = 'inicio' | 'lista';

export default function App() {
  const [vista, setVista] = useState<Vista>('inicio');
  const [query, setQuery] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState<Categoria | null>(null);
  const reproductor = useReproductor();

  const handleBuscar = (q: string) => {
    setQuery(q);
    setCategoriaActiva(null);
    setVista('lista');
  };

  const handleCategoria = (cat: Categoria) => {
    setQuery(cat.query);
    setCategoriaActiva(cat);
    setVista('lista');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {vista === 'inicio' ? (
        <InicioScreen onBuscar={handleBuscar} onCategoria={handleCategoria} />
      ) : (
        <ListaScreen
          query={query}
          categoriaActiva={categoriaActiva}
          reproductor={reproductor}
          onVolver={() => setVista('inicio')}
        />
      )}
      <ReproductorBar reproductor={reproductor} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d1a', paddingTop: 48 },
});
