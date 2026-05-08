override THREADS : u32 = 1024u;
override BLOCK_SIZE : u32 = 2048u;

@group(0) @binding(0) var<storage, read_write> data : array<u32>;
@group(0) @binding(1) var<storage, read> aux : array<u32>;

@compute @workgroup_size(THREADS)
fn addOffsets(@builtin(local_invocation_id) lid : vec3u, @builtin(workgroup_id) wid : vec3u) {
    if (wid.x == 0u) { return; }

    let tid = lid.x;
    let blockStart = wid.x * BLOCK_SIZE;
    let n = arrayLength(&data);
    let offset = aux[wid.x - 1u];

    let i0 = blockStart + tid * 2u;
    let i1 = blockStart + tid * 2u + 1u;
    if (i0 < n) { data[i0] = data[i0] + offset; }
    if (i1 < n) { data[i1] = data[i1] + offset; }
}
