import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import UserLayout from "../../layouts/UserLayout";
import { useToast } from "../../context/ToastContext";
import { getMyRatings, getRatingsForUser } from "../../service/home/api.rating";
import { formatDate } from "../../utils/utils";
import useAuth from "../../context/UseAuth";
import { Star, Loader2, ShoppingBag } from "lucide-react";
import "./MyReviews.css";

const SCORE_LABELS = {
  1: "Rất tệ",
  2: "Tệ",
  3: "Bình thường",
  4: "Tốt",
  5: "Rất tốt",
};

const PAGE_SIZE = 10;

export default function MyReviews() {
  const toast = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("sent"); // "sent" | "received"

  // Sent reviews state
  const [sentReviews, setSentReviews] = useState([]);
  const [sentTotal, setSentTotal] = useState(0);
  const [sentLoading, setSentLoading] = useState(true);
  const [sentLoadingMore, setSentLoadingMore] = useState(false);

  // Received reviews state
  const [receivedReviews, setReceivedReviews] = useState([]);
  const [receivedTotal, setReceivedTotal] = useState(0);
  const [receivedLoading, setReceivedLoading] = useState(true);
  const [receivedLoadingMore, setReceivedLoadingMore] = useState(false);

  const fetchSent = useCallback(async (skip = 0, append = false) => {
    try {
      if (append) setSentLoadingMore(true);
      else setSentLoading(true);
      const data = await getMyRatings(skip, PAGE_SIZE);
      setSentTotal(data.total);
      setSentReviews((prev) => (append ? [...prev, ...data.items] : data.items));
    } catch {
      toast.error("Không thể tải đánh giá đã gửi");
    } finally {
      setSentLoading(false);
      setSentLoadingMore(false);
    }
  }, [toast]);

  const fetchReceived = useCallback(async (skip = 0, append = false) => {
    if (!user?.userId) return;
    try {
      if (append) setReceivedLoadingMore(true);
      else setReceivedLoading(true);
      const data = await getRatingsForUser(user.userId, skip, PAGE_SIZE);
      setReceivedTotal(data.total);
      setReceivedReviews((prev) => (append ? [...prev, ...data.items] : data.items));
    } catch {
      toast.error("Không thể tải đánh giá nhận được");
    } finally {
      setReceivedLoading(false);
      setReceivedLoadingMore(false);
    }
  }, [toast, user?.userId]);

  useEffect(() => {
    fetchSent();
  }, [fetchSent]);

  useEffect(() => {
    fetchReceived();
  }, [fetchReceived]);

  const renderStars = (score) => (
    <div className="review-stars">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={18}
          className={`review-star ${s <= score ? "filled" : ""}`}
          fill={s <= score ? "#f59e0b" : "none"}
        />
      ))}
      <span style={{ marginLeft: 6, fontSize: 13, color: "#6B7280" }}>
        {SCORE_LABELS[score]}
      </span>
    </div>
  );

  const renderReviewList = (reviews, total, loading, loadingMore, onLoadMore, emptyText) => {
    if (loading) {
      return (
        <div className="reviews-loading">
          <Loader2 size={36} />
        </div>
      );
    }

    if (reviews.length === 0) {
      return (
        <div className="reviews-empty">
          <h3>Chưa có đánh giá nào</h3>
          <p>{emptyText}</p>
        </div>
      );
    }

    return (
      <>
        <div className="reviews-list">
          {reviews.map((review) => (
            <div key={review.ratingId} className="review-card">
              <div className="review-card-top">
                {renderStars(review.score)}
                <span className="review-date">{formatDate(review.createdAt)}</span>
              </div>

              {review.comment && (
                <p className="review-comment">{review.comment}</p>
              )}

              <div className="review-meta">
                <Link to={`/orders/${review.orderId}`} className="review-order-link">
                  <ShoppingBag size={14} />
                  Đơn hàng #{review.orderId}
                </Link>
              </div>
            </div>
          ))}
        </div>

        {reviews.length < total && (
          <div className="reviews-load-more">
            <button
              className="reviews-load-more-btn"
              onClick={onLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? "Đang tải..." : "Xem thêm"}
            </button>
          </div>
        )}
      </>
    );
  };

  return (
    <UserLayout>
      <div className="reviews-page">
        <div className="reviews-header">
          <h1>Đánh giá của tôi</h1>
        </div>

        <div className="reviews-tabs">
          <button
            className={`reviews-tab ${activeTab === "sent" ? "active" : ""}`}
            onClick={() => setActiveTab("sent")}
          >
            Đã gửi ({sentTotal})
          </button>
          <button
            className={`reviews-tab ${activeTab === "received" ? "active" : ""}`}
            onClick={() => setActiveTab("received")}
          >
            Nhận được ({receivedTotal})
          </button>
        </div>

        {activeTab === "sent"
          ? renderReviewList(
              sentReviews, sentTotal, sentLoading, sentLoadingMore,
              () => fetchSent(sentReviews.length, true),
              "Bạn có thể đánh giá người bán sau khi đơn hàng đã hoàn thành."
            )
          : renderReviewList(
              receivedReviews, receivedTotal, receivedLoading, receivedLoadingMore,
              () => fetchReceived(receivedReviews.length, true),
              "Chưa có ai đánh giá bạn."
            )
        }
      </div>
    </UserLayout>
  );
}
