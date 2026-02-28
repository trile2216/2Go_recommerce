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

// GET /subscription-plans/me/usage
// Response: { monthlyListingLimit, usedCount, remainingCount }
export const fetchMySubscriptionUsage = async () => {
    try {
        const response = await api.get('/subscription-plans/me/usage');
        return response.data;
    } catch (error) {
        console.error('Error fetching subscription usage:', error);
        throw error;
    }
};
