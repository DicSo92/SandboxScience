module.exports = {
    apps: [
        {
            name: 'SandboxScience',
            port: '3000',
            exec_mode: 'cluster',
            instances: 'max',
            script: './.output/server/index.mjs',
            args: 'start',

            log_file: '/var/log/pm2/sandbox-science.log',
            error_file: '/var/log/pm2/sandbox-science-error.log',
            out_file: '/var/log/pm2/sandbox-science-out.log',
            merge_logs: true,
        }
    ]
}