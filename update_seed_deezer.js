// Script temporal para obtener datos de Deezer y actualizar seed data
// Se ejecuta con node y actualiza la base de datos

const SUPABASE_API_URL = 'https://api.supabase.com/v1/projects/xyehncvvvprrqwnsefcr/database/query';
const SUPABASE_TOKEN = 'Bearer sbp_0092face347e9bd5c50f23676829ca454105ede3';

// Canciones del seed actual que necesitamos buscar en Deezer
const seedSongs = [
  { id: 'a0000001-0000-0000-0000-000000000001', title: 'Dakiti', artist: 'Bad Bunny, Jhay Cortez' },
  { id: 'a0000001-0000-0000-0000-000000000002', title: 'Titi Me Preguntó', artist: 'Bad Bunny' },
  { id: 'a0000001-0000-0000-0000-000000000003', title: 'Pepas', artist: 'Farruko' },
  { id: 'a0000001-0000-0000-0000-000000000004', title: 'Yonaguni', artist: 'Bad Bunny' },
  { id: 'a0000001-0000-0000-0000-000000000005', title: 'La Noche de Anoche', artist: 'Bad Bunny, Rosalía' },
  { id: 'a0000001-0000-0000-0000-000000000006', title: 'Callaíta', artist: 'Bad Bunny' },
  { id: 'a0000001-0000-0000-0000-000000000007', title: 'Gasolina', artist: 'Daddy Yankee' },
  { id: 'a0000002-0000-0000-0000-000000000001', title: 'Snowman', artist: 'WYS' },
  { id: 'a0000002-0000-0000-0000-000000000002', title: 'Coffee', artist: 'beabadoobee' },
  { id: 'a0000002-0000-0000-0000-000000000003', title: 'Sunset Lover', artist: 'Petit Biscuit' }
];

async function searchDeezer(title, artist) {
  try {
    const query = `artist:"${artist.split(',')[0].trim()}" track:"${title}"`;
    const url = `https://api.deezer.com/search/track?q=${encodeURIComponent(query)}`;
    
    console.log(`Buscando: ${title} - ${artist}`);
    console.log(`URL: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Error ${response.status}: ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.data && data.data.length > 0) {
      const track = data.data[0];
      console.log(`✅ Encontrado: ${track.title} - ${track.artist.name}`);
      return {
        deezer_id: track.id,
        cover_url: track.album.cover_medium || track.album.cover,
        preview_url: track.preview,
        album_name: track.album.title,
        duration_seconds: track.duration
      };
    } else {
      console.log(`❌ No encontrado: ${title} - ${artist}`);
      return null;
    }
  } catch (error) {
    console.error(`Error buscando ${title}:`, error.message);
    return null;
  }
}

async function updateDatabase(songId, deezerData) {
  try {
    const query = `
      UPDATE ws_songs 
      SET 
        deezer_id = ${deezerData.deezer_id},
        cover_url = '${deezerData.cover_url}',
        preview_url = '${deezerData.preview_url}',
        album_name = '${deezerData.album_name.replace(/'/g, "''")}'
      WHERE id = '${songId}';
    `;
    
    const response = await fetch(SUPABASE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': SUPABASE_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    });
    
    if (response.ok) {
      console.log(`✅ Actualizado en DB: ${songId}`);
    } else {
      console.error(`❌ Error actualizando ${songId}:`, await response.text());
    }
  } catch (error) {
    console.error(`Error actualizando ${songId}:`, error);
  }
}

async function main() {
  console.log('🎵 Actualizando seed data con información de Deezer...\n');
  
  for (const song of seedSongs) {
    const deezerData = await searchDeezer(song.title, song.artist);
    
    if (deezerData) {
      await updateDatabase(song.id, deezerData);
    }
    
    // Pausa para no saturar la API
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('---');
  }
  
  console.log('\n🎉 Actualización completada!');
}

main().catch(console.error);