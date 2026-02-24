import React, { useEffect, useState } from 'react';
import './SubscriptionPlans.css';
import { fetchSubscriptionPlans, fetchMySubscription } from '../../service/home/api.subscription';
import { createSubscriptionPayment } from '../../service/home/api.payment';
import { Check, Package } from 'lucide-react';
import PageEmptyState from '../../components/PageEmptyState';
import { useToast } from '../../context/ToastContext';

const SubscriptionPlans = () => {
    const [plans, setPlans] = useState([]);
    const [currentPlan, setCurrentPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const toast = useToast();

    useEffect(() => {
        const loadPlans = async () => {
            try {
                const [data, mySub] = await Promise.all([
                    fetchSubscriptionPlans(),
                    fetchMySubscription().catch(() => null)
                ]);
                setPlans(data.items || []);
                if (mySub && mySub.isActive) {
                    setCurrentPlan(mySub);
                }
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
            const response = await createSubscriptionPayment('PAYOS', code);
            
            if (response && response.status === 'PAID') {
                 toast.success('Đã kích hoạt gói dịch vụ thành công!');
                 window.location.reload();
            } else if (response && response.payUrl) {
                window.location.href = response.payUrl;
            } else {
                toast.error('Không thể tạo thanh toán. Vui lòng thử lại.');
            }
        } catch (error) {
            console.error('Payment creation failed:', error);
            const errMs = error?.response?.data || 'Đã có lỗi xảy ra khi tạo thanh toán.';
            toast.error(errMs);
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
                {plans.map((plan) => {
                    // Match current plan by code or name
                    const isCurrentPlan = currentPlan && 
                        (currentPlan.code === plan.code || currentPlan.name === plan.name || currentPlan.planCode === plan.code);

                    return (
                    <div key={plan.planId} className={`plan-card ${plan.isFeatured ? 'featured' : ''} ${isCurrentPlan ? 'current-plan-card' : ''}`}>
                        {plan.isFeatured && !isCurrentPlan && <div className="featured-badge">Phổ biến nhất</div>}
                        {isCurrentPlan && <div className="featured-badge current-badge">Gói hiện tại</div>}
                        
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
                            {isCurrentPlan ? (
                                <button 
                                    className="plan-btn outline current-btn"
                                    disabled
                                >
                                    Đang sử dụng
                                </button>
                            ) : (
                                <button 
                                    className={`plan-btn ${plan.isFeatured ? '' : 'outline'}`}
                                    onClick={() => handleBuySubscription(plan.code)}
                                >
                                    Chọn gói này
                                </button>
                            )}
                        </div>
                    </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SubscriptionPlans;
