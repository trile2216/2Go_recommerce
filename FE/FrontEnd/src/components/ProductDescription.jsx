export default function ProductDescription({ description, specifications }) {
  return (
    <div className="product-description-section">
      <div className="description-container">
        <div className="description-column">
          <h3 className="section-title">Mô tả chi tiết</h3>
          <div className="description-text">
            {description.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          <h4 className="subsection-title">Thông tin chi tiết:</h4>
          <ul className="feature-list">
            {specifications.highlights.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          <h4 className="subsection-title">Thông tin người bán:</h4>
          <ul className="feature-list">
            {specifications.included.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="reviews-column">
          <h3 className="section-title">Bình luận</h3>
          <div className="reviews-placeholder">
            <div className="no-reviews">
              <p>Hãy để lại bình luận cho người bán</p>
            </div>
            <div className="review-form">
              <textarea 
                placeholder="Chia sẻ trải nghiệm của bạn..." 
                className="review-input"
                rows="4"
              ></textarea>
              <button className="btn-submit-review">Gửi bình luận</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
