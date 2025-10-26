import { supabase } from './supabaseClient';
import logger from '../utils/logger';

export const avatarService = {
  /**
   * Upload de avatar do usuário
   */
  async uploadAvatar(file: File): Promise<{ url: string | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { url: null, error: { message: 'Usuário não autenticado' } };
      }

      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        return { url: null, error: { message: 'Apenas imagens são permitidas' } };
      }

      // Validar tamanho (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        return { url: null, error: { message: 'Imagem muito grande. Máximo 2MB' } };
      }

      // Nome do arquivo com timestamp para evitar conflitos
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload para Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type
        });

      if (uploadError) {
        return { url: null, error: uploadError };
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Atualizar perfil com novo avatar URL
      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      return { url: publicUrl, error: null };
    } catch (error) {
      logger.error('Error uploading avatar', error);
      return { url: null, error };
    }
  },

  /**
   * Deletar avatar do usuário
   */
  async deleteAvatar(): Promise<{ error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { error: { message: 'Usuário não autenticado' } };
      }

      // Obter avatar atual do perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();

      if (profile?.avatar_url) {
        // Extrair nome do arquivo da URL
        const urlParts = profile.avatar_url.split('/');
        const fileName = `${user.id}/${urlParts[urlParts.length - 1]}`;

        // Deletar do storage
        await supabase.storage
          .from('avatars')
          .remove([fileName]);
      }

      // Remover URL do perfil
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);

      return { error };
    } catch (error) {
      logger.error('Error deleting avatar', error);
      return { error };
    }
  }
};
