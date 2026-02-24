import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import UserLayout from '../../layouts/UserLayout';
import ListingCard from '../../components/ListingCard';
import PageEmptyState from '../../components/PageEmptyState';
import { useToast } from '../../context/ToastContext';
import { getMySavedListings, removeSavedListing } from '../../service/home/api.savedListing';
import { useTitle } from '../../hooks/useTitle';
import { formatDate } from '../../utils/utils';
import { Bookmark, Loader2, Trash2 } from 'lucide-react';
import './SavedListings.css';

export default function SavedListings() {
  useTitle('Saved Items');
  const navigate = useNavigate();
  const toast = useToast();

  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [skip, setSkip] = useState(0);
  const take = 20;

  const fetchSaved = useCallback(async (currentSkip = 0) => {
    try {
      setLoading(true);
      const data = await getMySavedListings(currentSkip, take);
      if (currentSkip === 0) {
        setListings(data.items || []);
      } else {
        setListings(prev => [...prev, ...(data.items || [])]);
      }
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Error fetching saved listings:', err);
      toast.error('Không thể tải danh sách tin đã lưu');
    } finally {
      setLoading(false);
    }
  }, [toast, take]);

  useEffect(() => {
    fetchSaved(0);
  }, [fetchSaved]);

  const handleLoadMore = () => {
    const newSkip = skip + take;
    setSkip(newSkip);
    fetchSaved(newSkip);
  };

  const handleRemove = async (listingId) => {
    setRemovingId(listingId);
    try {
      await removeSavedListing(listingId);
      setListings(prev => prev.filter(item => item.listingId !== listingId));
      setTotal(prev => prev - 1);
      toast.success('Đã bỏ lưu bài đăng');
    } catch (err) {
      console.error('Error removing saved listing:', err);
      toast.error('Bỏ lưu thất bại');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <UserLayout>
      <div className="saved-container">
        {/* Header */}
        <div className="saved-header">
          <h1 className="saved-title">Tin đã lưu</h1>
          <p className="saved-subtitle">Những bài đăng bạn đã lưu để xem sau</p>
        </div>

        {/* Content */}
        {loading && listings.length === 0 ? (
          <div className="loading-state">
            <div className="loader"></div>
            <div className="loading-state-text">Đang tải tin đã lưu...</div>
          </div>
        ) : listings.length === 0 ? (
          <PageEmptyState
            icon={<Bookmark size={56} />}
            title="Chưa có tin đã lưu"
            description="Lưu những bài đăng yêu thích để xem lại sau"
            actionLabel="Khám phá sản phẩm"
            actionTo="/listings"
          />
        ) : (
          <>
            <div className="saved-count">
              {total} tin đã lưu
            </div>
            <div className="saved-list">
              {listings.map(item => (
                <ListingCard
                  key={item.listingId}
                  listing={item}
                  meta={
                    item.savedAt && (
                      <span>Đã lưu: {formatDate(item.savedAt)}</span>
                    )
                  }
                  actions={
                    <button
                      className="saved-remove-btn"
                      title="Bỏ lưu"
                      onClick={() => handleRemove(item.listingId)}
                      disabled={removingId === item.listingId}
                    >
                      {removingId === item.listingId ? (
                        <Loader2 size={15} className="spin" />
                      ) : (
                        <Trash2 size={15} />
                      )}
                      <span>Bỏ lưu</span>
                    </button>
                  }
                  onClick={() => navigate(`/product/${item.listingId}`)}
                />
              ))}
            </div>

            {listings.length < total && (
              <div className="saved-load-more">
                <button
                  className="saved-load-more-btn"
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? (
                    <><Loader2 size={16} className="spin" /> Đang tải...</>
                  ) : (
                    'Xem thêm'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </UserLayout>
  );
}
