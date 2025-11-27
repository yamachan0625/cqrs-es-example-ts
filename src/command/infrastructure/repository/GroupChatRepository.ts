import { Repository } from '../../../shared/event-store-adapter/types';
import { GroupChat } from '../../domain/GroupChat';

/**
 * GroupChatRepository
 * GroupChat Aggregateの永続化を担当
 */
export interface GroupChatRepository extends Repository<GroupChat> {
  // 基本的なfindById, store, storeEventsはRepositoryインターフェースから継承
}
