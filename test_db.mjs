import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://ftswrrnuygjfvnwanbuh.supabase.co',
    'sb_publishable_-wI6bPEP3EiJRkOHyLkV4w_QEdCGwUw'
);

(async () => {
    console.log('Testing insert memory...');
    const memRes = await supabase.from('memories').insert({
        date: '2026.03.12',
        title: 'Test memory',
        description: 'Testing add image',
        mood: 'happy',
        author: '他'
    }).select().single();

    console.log("Memory result:", memRes.data, memRes.error);

    if (memRes.data) {
        console.log('Testing insert image...');
        const imgRes = await supabase.from('memory_images').insert({
            memory_id: memRes.data.id,
            filename: 'data:image/png;base64,iVBORw0K',
            original_name: 'test.png'
        }).select().single();
        console.log("Image result:", imgRes.data, imgRes.error);

        console.log('Testing select joined...');
        const joinRes = await supabase.from('memories').select('*, memory_images(*)').eq('id', memRes.data.id);
        console.log("Join result:", JSON.stringify(joinRes.data, null, 2), joinRes.error);

        // cleanup
        await supabase.from('memories').delete().eq('id', memRes.data.id);
    }
})();
