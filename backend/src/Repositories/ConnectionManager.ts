import { PrismaClient } from '@prisma/client';

export class ConnectionManager {
  private static prisma: PrismaClient | null = null;

  private constructor() {} // prevent instantiation

  // Returns the connection, or tries to reconnect if closed
  public static async getConnection(): Promise<PrismaClient> {
    if (!this.prisma) {
      try {
        this.prisma = new PrismaClient();
        await this.prisma.$connect();
        console.log('Database connected successfully');
      } catch (error) {
        console.error('Failed to connect to the database:', error);
        throw new Error('Database connection failed');
      }
    }
    return this.prisma;
  }

  // Reconnects if the connection was closed or disconnected
  public static async reconnect(): Promise<void> {
    if (this.prisma) {
      try {
        await this.prisma.$disconnect();
        this.prisma = null;  // Reset connection
      } catch (error) {
        console.error('Error disconnecting the previous connection:', error);
      }
    }
    this.prisma = new PrismaClient();
    await this.prisma.$connect();
    console.log('Reconnected to the database successfully');
  }

  // Close the connection
  public static async closeConnection(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect();
      this.prisma = null;
      console.log('Database connection closed');
    }
  }
}


