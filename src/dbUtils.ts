import { db } from './firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

export interface ChatMessageData {
  userId: string;
  role: 'user' | 'model';
  text: string;
  createdAt?: number;
}

export interface PedidoData {
  id: string;
  userId: string;
  description: string;
  address: string;
  status: 'pending' | 'in_progress' | 'resolved';
  createdAt: number;
}

/**
 * Guarda un nuevo mensaje de chat en la colección 'chat_messages'.
 * @param messageData Objeto con los datos del mensaje
 * @returns El ID del documento creado
 */
export async function saveChatMessage(messageData: ChatMessageData): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'chat_messages'), {
      ...messageData,
      createdAt: messageData.createdAt || Date.now()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error al guardar el mensaje de chat en Firestore:", error);
    throw error;
  }
}

/**
 * Consulta el historial de pedidos en la colección 'pedidos'.
 * @param userId El ID del usuario actual
 * @returns Lista de pedidos del usuario
 */
export async function getPedidosHistory(userId: string): Promise<PedidoData[]> {
  try {
    // Busca en la colección "pedidos" donde el userId coincide con el parámetro brindado
    const q = query(
      collection(db, 'pedidos'),
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    const pedidos: PedidoData[] = [];
    
    snapshot.forEach((doc) => {
      pedidos.push({ id: doc.id, ...doc.data() } as PedidoData);
    });
    
    // Ordenar de manera descendente por fecha de creación (de más reciente a más viejo)
    return pedidos.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Error al consultar el historial de pedidos desde Firestore:", error);
    throw error;
  }
}
