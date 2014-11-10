/*
 * Wrapper for process.env
 * 
 * @author Damiano Braga <damiano.braga@gmail.com>
 */

module.exports = function () {
    /**
     * Environment
     */
    process.env.PORT = process.env.PORT || 3001;
    process.env.THOTH_PORT = process.env.THOTH_PORT || '8983';
    process.env.THOTH_HOST = process.env.THOTH_HOST || 'localhost';
 
};
