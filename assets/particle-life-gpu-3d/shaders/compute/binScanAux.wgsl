override THREADS : u32 = 1024u;
override BLOCK_SIZE : u32 = 2048u;

var<workgroup> shared_data : array<u32, BLOCK_SIZE>;

@group(0) @binding(0) var<storage, read_write> data : array<u32>;

@compute @workgroup_size(THREADS)
fn scanAux(@builtin(local_invocation_id) lid : vec3u) {
    let tid = lid.x;
    let n = arrayLength(&data);

    let i0 = tid * 2u;
    let i1 = tid * 2u + 1u;

    var input0 : u32 = 0u;
    var input1 : u32 = 0u;
    if (i0 < n) { input0 = data[i0]; }
    if (i1 < n) { input1 = data[i1]; }
    shared_data[i0] = input0;
    shared_data[i1] = input1;
    workgroupBarrier();

    // Up-sweep
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

    // Clear last element (root of exclusive Blelloch)
    if (tid == 0u) {
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

    // Exclusive -> inclusive: shift right + add original value
    if (i0 < n) { data[i0] = shared_data[i0] + input0; }
    if (i1 < n) { data[i1] = shared_data[i1] + input1; }
}
