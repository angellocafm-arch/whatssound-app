// Script para actualizar las canciones restantes que fallaron por el error de INTEGER
const SUPABASE_API_URL = 'https://api.supabase.com/v1/projects/xyehncvvvprrqwnsefcr/database/query';
const SUPABASE_TOKEN = 'Bearer sbp_0092face347e9bd5c50f23676829ca454105ede3';

// Canciones que fallaron
const failedSongs = [
  { id: 'a0000001-0000-0000-0000-000000000007', title: 'Gasolina', artist: 'Daddy Yankee' },
  { id: 'a0000002-0000-0000-0000-000000000001', title: 'Snowman', artist: 'WYS' },
  { id: 'a0000002-0000-0000-0000-000000000003', title: 'Sunset Lover', artist: 'Petit Biscuit' }
];

async function searchDeezer(title, artist) {
  try {
    const query = `artist:"${artist.split(',')[0].trim()}" track:"${title}"`;
    const url = `https://api.deezer.com/search/track?q=${encodeURIComponent(query)}`;
    
    console.log(`Buscando: ${title} - ${artist}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.data && data.data.length > 0) {
      const track = data.data[0];
      console.log(`✅ Encontrado: ${track.title} - ${track.artist.name} (ID: ${track.id})`);
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
    
    console.log(`Actualizando ${songId} con Deezer ID: ${deezerData.deezer_id}`);
    
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
      const errorText = await response.text();
      console.error(`❌ Error actualizando ${songId}:`, errorText);
    }
  } catch (error) {
    console.error(`Error actualizando ${songId}:`, error);
  }
}

async function main() {
  console.log('🔧 Corrigiendo canciones que fallaron...\n');
  
  for (const song of failedSongs) {
    const deezerData = await searchDeezer(song.title, song.artist);
    
    if (deezerData) {
      await updateDatabase(song.id, deezerData);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('---');
  }
  
  console.log('\n🎉 Corrección completada!');
}

main().catch(console.error);