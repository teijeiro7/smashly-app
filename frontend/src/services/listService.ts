import { supabase } from '../lib/supabase';
import { List, ListWithRackets, CreateListRequest, UpdateListRequest } from '../types/list';

export class ListService {
  static async getUserLists(): Promise<List[]> {
    const { data, error } = await supabase
      .from('lists')
      .select('*, racket_count:list_rackets(count)')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data ?? []).map((list: any) => ({
      ...list,
      racket_count: list.racket_count?.[0]?.count ?? 0,
    })) as List[];
  }

  static async getListById(listId: string): Promise<ListWithRackets> {
    const { data, error } = await supabase
      .from('lists')
      .select('*, rackets:list_rackets(racket:rackets(*))')
      .eq('id', listId)
      .single();

    if (error) throw new Error(error.message);

    const rackets = (data.rackets ?? []).map((lr: any) => lr.racket).filter(Boolean);
    return { ...data, rackets } as ListWithRackets;
  }

  static async createList(listData: CreateListRequest): Promise<List> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No hay sesión activa');

    const { data, error } = await supabase
      .from('lists')
      .insert({
        user_id: session.user.id,
        name: listData.name,
        description: listData.description ?? null,
        is_public: false,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as List;
  }

  static async updateList(listId: string, updates: UpdateListRequest): Promise<List> {
    const { data, error } = await supabase
      .from('lists')
      .update({ name: updates.name, description: updates.description ?? null })
      .eq('id', listId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as List;
  }

  static async deleteList(listId: string): Promise<void> {
    const { error } = await supabase.from('lists').delete().eq('id', listId);
    if (error) throw new Error(error.message);
  }

  static async addRacketToList(listId: string, racketId: number): Promise<void> {
    const { error } = await supabase
      .from('list_rackets')
      .insert({ list_id: listId, racket_id: racketId });

    if (error && error.code !== '23505') throw new Error(error.message); // ignore duplicate
  }

  static async removeRacketFromList(listId: string, racketId: number): Promise<void> {
    const { error } = await supabase
      .from('list_rackets')
      .delete()
      .eq('list_id', listId)
      .eq('racket_id', racketId);

    if (error) throw new Error(error.message);
  }
}
