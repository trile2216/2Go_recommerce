import api from '../../config/axios';

export const fetchSubscriptionPlans = async () => {
    try {
        const response = await api.get('/subscription-plans');
        return response.data;
    } catch (error) {
        console.error('Error fetching subscription plans:', error);
        throw error;
    }
};

export const fetchMySubscription = async () => {
    try {
        const response = await api.get('/subscription-plans/me');
        return response.data;
    } catch (error) {
        console.error('Error fetching my subscription:', error);
        throw error;
    }
};
