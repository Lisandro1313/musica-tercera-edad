export interface Cancion {
  id: string;
  titulo: string;
  artista: string;
  duracion: string;
  urlStream: string;
  urlDescarga: string;
  descargada?: boolean;
  rutaLocal?: string;
}

export interface Categoria {
  id: string;
  label: string;
  emoji: string;
  color: string;
  query: string;
}

export const CATEGORIAS: Categoria[] = [
  { id: 'folklore', label: 'Folklore', emoji: '🎸', color: '#8B4513', query: 'folklore argentino' },
  { id: 'tango', label: 'Tango', emoji: '🌹', color: '#C0392B', query: 'tango argentino' },
  { id: 'tropical', label: 'Tropical', emoji: '🌴', color: '#E67E22', query: 'cumbia tropical argentina' },
  { id: 'clasica', label: 'Clásica', emoji: '🎻', color: '#7D3C98', query: 'musica clasica orquesta' },
  { id: 'boleros', label: 'Boleros', emoji: '🌙', color: '#1A5276', query: 'boleros romanticos' },
  { id: 'alegre', label: 'Alegre', emoji: '😄', color: '#27AE60', query: 'musica alegre fiesta' },
  { id: 'relajante', label: 'Relajante', emoji: '😌', color: '#2E86C1', query: 'musica relajante tranquila' },
  { id: 'religion', label: 'Religiosa', emoji: '🙏', color: '#6C3483', query: 'musica religiosa cristiana' },
];

export async function buscarCanciones(query: string, pagina = 1): Promise<Cancion[]> {
  const rows = 20;
  const start = (pagina - 1) * rows;
  const url =
    `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}+AND+mediatype:audio&fl[]=identifier,title,creator,length&sort[]=downloads+desc&rows=${rows}&start=${start}&output=json`;

  const res = await fetch(url);
  const data = await res.json();
  const docs = data?.response?.docs ?? [];

  const canciones: Cancion[] = [];
  for (const doc of docs) {
    if (!doc.identifier) continue;
    canciones.push({
      id: doc.identifier,
      titulo: limpiarTitulo(doc.title || doc.identifier),
      artista: doc.creator || 'Artista desconocido',
      duracion: formatearDuracion(doc.length),
      urlStream: `https://archive.org/download/${doc.identifier}`,
      urlDescarga: `https://archive.org/download/${doc.identifier}`,
    });
  }
  return canciones;
}

export async function getArchivosMp3(identifier: string): Promise<string | null> {
  try {
    const url = `https://archive.org/metadata/${identifier}`;
    const res = await fetch(url);
    const data = await res.json();
    const archivos: { name?: string; format?: string }[] = data?.files ?? [];
    const mp3 = archivos.find(
      f => f.name?.endsWith('.mp3') && f.format?.toLowerCase().includes('mp3')
    );
    if (mp3?.name) return `https://archive.org/download/${identifier}/${encodeURIComponent(mp3.name)}`;
    // Fallback: primer archivo de audio
    const audio = archivos.find(f =>
      f.name?.match(/\.(mp3|ogg|flac|wav|m4a)$/i)
    );
    if (audio?.name) return `https://archive.org/download/${identifier}/${encodeURIComponent(audio.name)}`;
    return null;
  } catch {
    return null;
  }
}

function limpiarTitulo(titulo: string): string {
  return titulo
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .slice(0, 50);
}

function formatearDuracion(seg: string | number | null | undefined): string {
  if (!seg) return '--:--';
  const n = typeof seg === 'string' ? parseFloat(seg) : seg;
  if (isNaN(n)) return '--:--';
  const m = Math.floor(n / 60);
  const s = Math.floor(n % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
