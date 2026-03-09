// backend/src/index.ts
import dotenv from 'dotenv';
import { scannerScheduler } from './engine/ScannerScheduler';

// Carrega as variáveis de ambiente (.env)
dotenv.config();

console.log('=========================================');
console.log('🚀 Iniciando SurebetPro Backend Engine');
console.log('=========================================');

// Inicia o orquestrador de escaneamento
scannerScheduler.start().catch(err => {
  console.error('Falha crítica ao iniciar o Scanner:', err);
});

// Em um ambiente real, aqui também inicializaríamos o servidor Express/Fastify
// para servir a API REST para o Frontend (Next.js/React).
