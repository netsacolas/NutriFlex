import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { profileService } from '../services/profileService';
import type { UserProfile } from '../types';

/**
 * Hook customizado para verificar dados obrigatórios do perfil
 * Se os dados não estiverem preenchidos, redireciona para onboarding
 * Dados obrigatórios: weight, height, age, gender
 */
export const useRequiredProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkProfile();
  }, []);

  const checkProfile = async () => {
    setIsLoading(true);
    try {
      const session = await authService.getCurrentSession();
      if (!session) {
        navigate('/login');
        return;
      }

      const { data: userProfile } = await profileService.getProfile();

      if (userProfile) {
        // Verificar se dados obrigatórios estão preenchidos
        const hasRequiredData =
          userProfile.weight &&
          userProfile.height &&
          userProfile.age &&
          userProfile.gender;

        if (!hasRequiredData) {
          // Redirecionar para onboarding
          navigate('/onboarding');
          return;
        }

        setProfile(userProfile);
      }
    } catch (error) {
      console.error('Error checking profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return { profile, isLoading, reloadProfile: checkProfile };
};
