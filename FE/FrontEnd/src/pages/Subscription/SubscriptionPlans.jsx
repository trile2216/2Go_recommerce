import React, { useEffect, useState } from 'react';
import './SubscriptionPlans.css';
import { fetchSubscriptionPlans } from '../../service/home/api.subscription';
import { createSubscriptionPayment } from '../../service/home/api.payment';
import { Check, Package } from 'lucide-react';
import PageEmptyState from '../../components/PageEmptyState';
import { useToast } from '../../context/ToastContext';

const SubscriptionPlans = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const toast = useToast();

    useEffect(() => {
        const loadPlans = async () => {
            try {
                const data = await fetchSubscriptionPlans();
                setPlans(data.items || []);
            } catch (err) {
                setError('Failed to load subscription plans. Please try again later.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadPlans();
    }, []);

    const handleBuySubscription = async (code) => {
        try {
            // Assuming we want to show some loading state for the button or global
            // For now, let's just proceed. Ideally, we should have a local loading state per button.
            const response = await createSubscriptionPayment('PAYOS', code);
            if (response && response.payUrl) {
                window.location.href = response.payUrl;
            } else {
                toast.error('Không thể tạo thanh toán. Vui lòng thử lại.');
            }
        } catch (error) {
            console.error('Payment creation failed:', error);
            toast.error('Đã có lỗi xảy ra khi tạo thanh toán.');
        }
    };

    if (!loading && plans.length === 0) {
        return (
            <div className="subscription-plans-container">
                <PageEmptyState
                    icon={<Package size={64} className="text-gray-300" />}
                    title="Chưa có gói dịch vụ"
                    description="Hiện tại hệ thống chưa có gói hội viên nào. Vui lòng quay lại sau."
                    actionLabel="Về trang chủ"
                    actionTo="/"
                />
            </div>
        );
    }

    if (error) {
        return (
            <div className="subscription-plans-container">
                <div className="error-message">
                    <h3>Error</h3>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="subscription-plans-container">
            <div className="subscription-plans-header">
                <h1 className="subscription-plans-title">Gói Hội Viên</h1>
                <p className="subscription-plans-subtitle">
                    Nâng cấp tài khoản của bạn để mở khóa nhiều tính năng hơn và tăng giới hạn đăng tin.
                </p>
            </div>

            <div className="subscription-plans-grid">
                {plans.map((plan) => (
                    <div key={plan.planId} className={`plan-card ${plan.isFeatured ? 'featured' : ''}`}>
                        {plan.isFeatured && <div className="featured-badge">Phổ biến nhất</div>}
                        
                        <div className="plan-header">
                            <h2 className="plan-name">{plan.name}</h2>
                            <div className="plan-price">
                                {plan.price.toLocaleString('vi-VN')}
                                <span className="plan-currency">₫</span>
                            </div>
                            <p className="plan-duration">/{plan.durationDays} ngày</p>
                        </div>

                        <ul className="plan-features">
                            <li className="plan-feature-item">
                                <Check size={18} className="feature-icon" />
                                <span>Giới hạn đăng tin: <strong>{plan.monthlyListingLimit ? plan.monthlyListingLimit : 'Không giới hạn'}</strong> tin/tháng</span>
                            </li>
                            {plan.description && (
                                <li className="plan-feature-item">
                                    <Check size={18} className="feature-icon" />
                                    <span>{plan.description}</span>
                                </li>
                            )}
                            {/* Dummy features based on common tiers, ideally come from backend */}
                            <li className="plan-feature-item">
                                <Check size={18} className="feature-icon" />
                                <span>Hỗ trợ ưu tiên</span>
                            </li>
                        </ul>

                        <div className="plan-action">
                            <button 
                                className={`plan-btn ${plan.isFeatured ? '' : 'outline'}`}
                                onClick={() => handleBuySubscription(plan.code)}
                            >
                                Chọn gói này
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SubscriptionPlans;
