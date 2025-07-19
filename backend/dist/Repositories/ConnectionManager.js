"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionManager = void 0;
const client_1 = require("@prisma/client");
class ConnectionManager {
    constructor() { } // prevent instantiation
    // Returns the connection, or tries to reconnect if closed
    static async getConnection() {
        if (!this.prisma) {
            try {
                this.prisma = new client_1.PrismaClient();
                await this.prisma.$connect();
                console.log('Database connected successfully');
            }
            catch (error) {
                console.error('Failed to connect to the database:', error);
                throw new Error('Database connection failed');
            }
        }
        return this.prisma;
    }
    // Reconnects if the connection was closed or disconnected
    static async reconnect() {
        if (this.prisma) {
            try {
                await this.prisma.$disconnect();
                this.prisma = null; // Reset connection
            }
            catch (error) {
                console.error('Error disconnecting the previous connection:', error);
            }
        }
        this.prisma = new client_1.PrismaClient();
        await this.prisma.$connect();
        console.log('Reconnected to the database successfully');
    }
    // Close the connection
    static async closeConnection() {
        if (this.prisma) {
            await this.prisma.$disconnect();
            this.prisma = null;
            console.log('Database connection closed');
        }
    }
}
exports.ConnectionManager = ConnectionManager;
ConnectionManager.prisma = null;
//# sourceMappingURL=ConnectionManager.js.map