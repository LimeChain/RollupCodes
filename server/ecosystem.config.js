/**
 * PM2 Configuration for Production Deployment
 *
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 logs exit-hatch-backend
 *   pm2 restart exit-hatch-backend
 *   pm2 stop exit-hatch-backend
 */

module.exports = {
    apps: [{
        name: 'exit-hatch-backend',
        script: 'index.js',

        // Cluster mode for load balancing
        instances: process.env.PM2_INSTANCES || 2,
        exec_mode: 'cluster',

        // Environment
        env_production: {
            NODE_ENV: 'production',
            PORT: 3002
        },

        // Logging
        error_file: './logs/err.log',
        out_file: './logs/out.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        merge_logs: true,

        // Restart policy
        max_memory_restart: '500M',
        exp_backoff_restart_delay: 100,
        max_restarts: 10,
        min_uptime: '10s',

        // Auto-restart on file changes (disable in production)
        watch: false,
        ignore_watch: ['node_modules', 'logs', '.git'],

        // Advanced features
        autorestart: true,
        kill_timeout: 5000,
        wait_ready: true,
        listen_timeout: 10000
    }]
}
