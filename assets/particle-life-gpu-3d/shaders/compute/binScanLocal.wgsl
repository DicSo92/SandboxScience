override THREADS : u32 = 1024u;
override BLOCK_SIZE : u32 = 2048u;

var<workgroup> shared_data : array<u32, BLOCK_SIZE>;

@group(0) @binding(0) var<storage, read_write> data : array<u32>;
@group(0) @binding(1) var<storage, read_write> aux : array<u32>;

@compute @workgroup_size(THREADS)
fn scanLocal(@builtin(local_invocation_id) lid : vec3u, @builtin(workgroup_id) wid : vec3u) {
    let tid = lid.x;
    let blockStart = wid.x * BLOCK_SIZE;
    let n = arrayLength(&data);

    let i0 = blockStart + tid * 2u;
    let i1 = blockStart + tid * 2u + 1u;

    // Load 2 contigus elements per thread (coalesced access)
    var input0 : u32 = 0u;
    var input1 : u32 = 0u;
    if (i0 < n) { input0 = data[i0]; }
    if (i1 < n) { input1 = data[i1]; }
    shared_data[tid * 2u] = input0;
    shared_data[tid * 2u + 1u] = input1;
    workgroupBarrier();

    // Up-sweep (reduce)
    var offset : u32 = 1u;
    for (var d : u32 = THREADS; d > 0u; d = d >> 1u) {
        if (tid < d) {
            let ai = offset * (2u * tid + 1u) - 1u;
            let bi = offset * (2u * tid + 2u) - 1u;
            shared_data[bi] = shared_data[bi] + shared_data[ai];
        }
        workgroupBarrier();
        offset = offset << 1u;
    }

    // Save total sum in aux[] and clear last element (prepare for down-sweep)
    if (tid == 0u) {
        aux[wid.x] = shared_data[BLOCK_SIZE - 1u];
        shared_data[BLOCK_SIZE - 1u] = 0u;
    }
    workgroupBarrier();

    // Down-sweep
    for (var d : u32 = 1u; d < BLOCK_SIZE; d = d << 1u) {
        offset = offset >> 1u;
        if (tid < d) {
            let ai = offset * (2u * tid + 1u) - 1u;
            let bi = offset * (2u * tid + 2u) - 1u;
            let t = shared_data[ai];
            shared_data[ai] = shared_data[bi];
            shared_data[bi] = shared_data[bi] + t;
        }
        workgroupBarrier();
    }

    // Convert exclusive → inclusive (by adding original input) + write back
    if (i0 < n) { data[i0] = shared_data[tid * 2u] + input0; }
    if (i1 < n) { data[i1] = shared_data[tid * 2u + 1u] + input1; }
}
