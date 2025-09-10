const cron = require('node-cron');
const reminderService = require('../services/reminderService');

class CronJobs {
    constructor() {
        this.jobs = [];
        this.isEnabled = process.env.REMINDERS_CRON_ENABLED === 'true';
        this.cronExpression = process.env.REMINDERS_CRON_EXPR || '*/5 * * * *'; // Default: every 5 minutes
    }

    /**
     * Initialize and start all cron jobs
     */
    init() {
        if (!this.isEnabled) {
            console.log('🕒 Cron jobs are disabled (REMINDERS_CRON_ENABLED=false)');
            return;
        }

        console.log(`🕒 Initializing cron jobs with expression: ${this.cronExpression}`);
        
        // Email reminders job
        const reminderJob = cron.schedule(this.cronExpression, async () => {
            await this.processEmailReminders();
        }, {
            scheduled: false, // Don't start immediately
            timezone: process.env.TZ || 'Europe/Warsaw'
        });

        this.jobs.push({
            name: 'email-reminders',
            job: reminderJob,
            description: 'Process pending email reminders'
        });

        // Start all jobs
        this.startAll();
    }

    /**
     * Process email reminders job
     */
    async processEmailReminders() {
        const startTime = Date.now();
        console.log('🔄 [CRON] Starting email reminders processing...');

        try {
            const results = await reminderService.processPendingReminders();
            const duration = Date.now() - startTime;
            
            console.log(`✅ [CRON] Email reminders processed in ${duration}ms:`, {
                processed: results.processed,
                sent: results.sent,
                failed: results.failed,
                errors: results.errors.length
            });

            // Log errors if any
            if (results.errors.length > 0) {
                console.error('❌ [CRON] Reminder processing errors:', results.errors);
            }

        } catch (error) {
            const duration = Date.now() - startTime;
            console.error(`❌ [CRON] Email reminders processing failed after ${duration}ms:`, {
                error: error.message,
                stack: error.stack
            });
        }
    }

    /**
     * Start all cron jobs
     */
    startAll() {
        this.jobs.forEach(jobInfo => {
            jobInfo.job.start();
            console.log(`✅ Started cron job: ${jobInfo.name} - ${jobInfo.description}`);
        });
    }

    /**
     * Stop all cron jobs
     */
    stopAll() {
        this.jobs.forEach(jobInfo => {
            jobInfo.job.stop();
            console.log(`⏹️  Stopped cron job: ${jobInfo.name}`);
        });
    }

    /**
     * Get status of all jobs
     */
    getStatus() {
        return {
            enabled: this.isEnabled,
            cronExpression: this.cronExpression,
            timezone: process.env.TZ || 'Europe/Warsaw',
            jobs: this.jobs.map(jobInfo => ({
                name: jobInfo.name,
                description: jobInfo.description,
                running: jobInfo.job.running || false
            }))
        };
    }

    /**
     * Manually trigger email reminders processing (for testing)
     */
    async triggerEmailReminders() {
        console.log('🔧 [MANUAL] Triggering email reminders processing...');
        return await this.processEmailReminders();
    }
}

module.exports = new CronJobs();
