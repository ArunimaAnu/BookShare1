import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FaArrowLeft,
  FaBook,
  FaUser,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaExchangeAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle,
  FaCommentAlt,
  FaStar,
  FaTruck,
  FaCreditCard,
  FaHandshake,
  FaUndo,
  FaClipboardCheck,
  FaExclamationTriangle,
  FaFlag
} from 'react-icons/fa';
import './ExchangeDetails.css';
import PaymentModal from './PaymentModal';

const ExchangeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [exchange, setExchange] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [complaint, setComplaint] = useState({
    subject: '',
    description: '',
    category: 'behavior'
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    fetchExchangeDetails();
    fetchUserData();
  }, [id]);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get('http://localhost:5000/user', {
        headers: {
          'x-auth-token': token
        }
      });

      if (response.data.status === 'success') {
        setUserData(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  const fetchExchangeDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(`http://localhost:5000/exchanges/${id}`, {
        headers: {
          'x-auth-token': token
        }
      });

      if (response.data.status === 'success') {
        // Log the exchange data for debugging
        console.log('Exchange data received:', response.data.data);

        // Process the data
        setExchange(response.data.data);

        // Debug check for reviews
        if (response.data.data.ownerReview) {
          console.log('Owner review found:', response.data.data.ownerReview);
        }
        if (response.data.data.borrowerReview) {
          console.log('Borrower review found:', response.data.data.borrowerReview);
        }
      } else {
        setError('Failed to load exchange details');
      }
    } catch (err) {
      console.error('Error fetching exchange details:', err);
      setError('Error loading exchange details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isOwner = () => {
    return userData && exchange && exchange.ownerId._id === userData._id;
  };

  const isBorrower = () => {
    return userData && exchange && exchange.borrowerId._id === userData._id;
  };

  const showConfirmationModal = (action, message) => {
    setConfirmAction(action);
    setConfirmMessage(message);
    setShowConfirmModal(true);
  };

  const handleConfirmAction = async () => {
    setActionLoading(true);
    setError(null); // Clear any previous errors

    try {
      console.log(`Executing action: ${confirmAction}`);

      switch (confirmAction) {
        case 'cancel':
          await cancelExchange();
          break;
        case 'handover':
          await confirmHandover();
          break;
        case 'return':
          await confirmReturn();
          break;
        case 'markReturned':
          await markBookReturned();
          break;
        case 'payDeposit':
          setShowConfirmModal(false);
          setShowPaymentModal(true);
          return; // Early return for deposit
        default:
          console.error('Unknown action:', confirmAction);
          setError(`Unknown action: ${confirmAction}`);
          return;
      }

      // If we get here, action was successful
      console.log(`Action ${confirmAction} completed successfully`);
      fetchExchangeDetails(); // Refresh the data after successful action

    } catch (error) {
      console.error(`Error performing ${confirmAction}:`, error);

      // Don't overwrite error if it was already set in the action function
      if (!error) {
        setError(`Failed to ${confirmAction}. Please try again.`);
      }
    } finally {
      setActionLoading(false);
      setShowConfirmModal(false);
    }
  };

  const cancelExchange = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Authentication error. Please login again.');
        return;
      }

      const response = await axios.put(`http://localhost:5000/exchanges/${id}/cancel`, {}, {
        headers: {
          'x-auth-token': token
        }
      });

      if (response.data.status === 'success') {
        console.log('Exchange cancelled successfully');
        fetchExchangeDetails();
        // Navigate to exchanges list after successful cancellation
        navigate('/exchanges');
      } else {
        setError('Failed to cancel exchange');
      }
    } catch (err) {
      console.error('Error cancelling exchange:', err);
      setError(err.response?.data?.message || 'Failed to cancel exchange. Please try again.');
    }
  };

  const confirmHandover = async () => {
    const token = localStorage.getItem('token');

    const response = await axios.put(`http://localhost:5000/exchanges/${id}/handover`, {}, {
      headers: {
        'x-auth-token': token
      }
    });

    if (response.data.status === 'success') {
      fetchExchangeDetails();
    } else {
      setError('Failed to confirm handover');
    }
  };

  // New function to mark a book as returned by borrower
  const markBookReturned = async () => {
    try {
      console.log('Starting markBookReturned, exchange ID:', id);
      const token = localStorage.getItem('token');

      if (!token) {
        console.error('No auth token found');
        setError('Authentication error. Please login again.');
        return;
      }

      // Make direct API call - no notification creation on client side
      const response = await axios.put(
        `http://localhost:5000/exchanges/${id}/mark-returned`,
        {},
        {
          headers: {
            'x-auth-token': token
          }
        }
      );

      console.log('API Response:', response.data);

      if (response.data.status === 'success') {
        console.log('Successfully marked book as returned');
        // Refresh the exchange details
        await fetchExchangeDetails();
      } else {
        console.error('Unexpected response format:', response.data);
        setError('Unexpected response from server');
      }
    } catch (err) {
      console.error('Error in markBookReturned:', err);

      // Get detailed error message
      let errorMessage = 'Failed to mark book as returned. Please try again.';
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      }

      setError(errorMessage);
      throw err; // Important: rethrow so handleConfirmAction can catch it
    }
  };

  const confirmReturn = async () => {
    const token = localStorage.getItem('token');

    const response = await axios.put(`http://localhost:5000/exchanges/${id}/return`, {}, {
      headers: {
        'x-auth-token': token
      }
    });

    if (response.data.status === 'success') {
      fetchExchangeDetails();
    } else {
      setError('Failed to confirm return');
    }
  };

  const payDeposit = async () => {
    setActionLoading(true);

    try {
      const token = localStorage.getItem('token');

      // Call the endpoint to update deposit status
      const response = await axios.put(`http://localhost:5000/exchanges/${id}/pay-deposit`, {}, {
        headers: {
          'x-auth-token': token
        }
      });

      if (response.data.status === 'success') {
        fetchExchangeDetails();
      } else {
        setError('Failed to process payment');
      }
    } catch (err) {
      console.error('Error processing payment:', err);
      setError('Payment processing failed. Please try again.');
    } finally {
      setActionLoading(false);
      setShowPaymentModal(false);
    }
  };

  const handleSubmitRating = async () => {
    setActionLoading(true);

    try {
      const token = localStorage.getItem('token');

      // Create a proper review object with rating and optional comment
      const reviewData = {
        rating: Number(rating), // Ensure it's a number
        comment: reviewComment || ''
      };

      console.log('Submitting rating:', reviewData);

      const response = await axios.post(`http://localhost:5000/exchanges/${id}/review`,
        reviewData,
        {
          headers: {
            'x-auth-token': token
          }
        }
      );

      if (response.data.status === 'success') {
        console.log('Rating submitted successfully:', response.data);
        setShowRatingModal(false);
        setReviewComment('');
        setError(null); // Clear any existing errors

        // Wait a moment before refreshing to ensure server has processed the update
        setTimeout(() => {
          fetchExchangeDetails();
        }, 500);
      } else {
        console.error('Unexpected success response:', response.data);
        setError('Failed to submit rating - unexpected response');
      }
    } catch (err) {
      console.error('Error submitting rating:', err);
      if (err.response) {
        console.error('Server responded with:', err.response.status, err.response.data);

        if (err.response.status === 400 &&
          err.response.data.message &&
          err.response.data.message.includes('already reviewed')) {
          // Handle the case where the user has already reviewed
          setError('You have already submitted a review for this exchange');
          setShowRatingModal(false);

          // Force refresh to get updated data
          fetchExchangeDetails();
        } else {
          const errorMsg = err.response.data.message || 'Please try again.';
          setError(`Failed to submit rating: ${errorMsg}`);
        }
      } else {
        setError('Failed to submit rating. Please try again.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitComplaint = async () => {
    setActionLoading(true);

    try {
      const token = localStorage.getItem('token');

      // Get the other party's ID
      const complaineeId = isOwner() ? exchange.borrowerId._id : exchange.ownerId._id;
      const complaineeName = isOwner() ? exchange.borrowerId.name : exchange.ownerId.name;

      const response = await axios.post(`http://localhost:5000/complaints`, {
        exchangeId: id,
        complaineeId: complaineeId,
        complaineeName: complaineeName,
        bookId: exchange.bookId._id,
        bookTitle: exchange.bookId.title,
        subject: complaint.subject,
        description: complaint.description,
        category: complaint.category
      }, {
        headers: {
          'x-auth-token': token
        }
      });

      if (response.data.status === 'success') {
        setShowComplaintModal(false);
        setComplaint({ subject: '', description: '', category: 'behavior' });
        alert('Complaint submitted successfully. An admin will review your complaint.');
      } else {
        setError('Failed to submit complaint');
      }
    } catch (err) {
      console.error('Error submitting complaint:', err);
      setError('Failed to submit complaint. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'accepted': return 'status-accepted';
      case 'borrowed': return 'status-borrowed';
      case 'returnRequested': return 'status-return-requested';
      case 'returned': return 'status-returned';
      case 'completed': return 'status-completed';
      case 'rejected': return 'status-rejected';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <FaInfoCircle />;
      case 'accepted': return <FaCheckCircle />;
      case 'borrowed': return <FaBook />;
      case 'returnRequested': return <FaTruck />;
      case 'returned': return <FaCheckCircle />;
      case 'completed': return <FaCheckCircle />;
      case 'rejected': return <FaTimesCircle />;
      case 'cancelled': return <FaTimesCircle />;
      default: return <FaExchangeAlt />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pending Approval';
      case 'accepted': return 'Accepted';
      case 'borrowed': return 'Book Borrowed';
      case 'returnRequested': return 'Return In Progress';
      case 'returned': return 'Book Returned';
      case 'completed': return 'Exchange Completed';
      case 'rejected': return 'Request Rejected';
      case 'cancelled': return 'Exchange Cancelled';
      default: return status;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStars = (currentRating, isClickable = false) => {
    return (
      <div className="stars-container">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={star <= currentRating ? "star filled" : "star"}
            onClick={isClickable ? () => setRating(star) : undefined}
            style={isClickable ? { cursor: 'pointer' } : {}}
          >
            <FaStar />
          </span>
        ))}
      </div>
    );
  };

  const canCancel = () => {
    console.log('Checking canCancel:', exchange?.status, isOwner(), isBorrower());
    // Only allow cancellation in pending or accepted state, and only by exchange participants
    return exchange && 
           ['pending', 'accepted'].includes(exchange.status) && 
           (isOwner() || isBorrower());
  };

  // Updated function to check if the user can confirm handover
  const canConfirmHandover = () => {
    if (!exchange || exchange.status !== 'accepted') return false;

    if (isOwner()) {
      // Owner can only confirm handover if book doesn't need return OR deposit is paid
      return !exchange.bookId.needsReturn || exchange.cautionDeposit.paid;
    } else if (isBorrower()) {
      // Borrower can confirm handover if no deposit needed OR deposit is paid
      return !exchange.bookId.needsReturn || exchange.cautionDeposit.paid;
    }

    return false;
  };

  // New function to check if borrower can mark book as returned
  const canMarkReturned = () => {
    console.log('Checking canMarkReturned:', exchange?.status, isBorrower());
    // Only show if status is borrowed AND the user is the borrower
    return exchange &&
      exchange.status === 'borrowed' &&
      isBorrower();
  };

  // Updated function to check if owner can confirm return
  const canConfirmReturn = () => {
    // Only show if status is returnRequested AND the user is the owner
    return exchange &&
      exchange.status === 'returnRequested' &&
      isOwner();
  };
  const canPayDeposit = () => {
    console.log('canPayDeposit check:',
      exchange?.status,
      isBorrower(),
      exchange?.bookId?.needsReturn,
      exchange?.cautionDeposit?.amount,
      !exchange?.cautionDeposit?.paid
    );
    
    return exchange &&
      exchange.status === 'accepted' &&
      isBorrower() &&
      exchange.bookId.needsReturn &&
      exchange.cautionDeposit.amount > 0 &&
      !exchange.cautionDeposit.paid;
  };

  const canLeaveRating = () => {
    if (!exchange || !['returned', 'completed'].includes(exchange.status)) return false;

    if (isOwner()) {
      // Check if ownerReview exists and has data (some servers might return empty objects)
      return !(exchange.ownerReview &&
        (exchange.ownerReview.rating ||
          Object.keys(exchange.ownerReview).length > 0));
    } else if (isBorrower()) {
      // Check if borrowerReview exists and has data
      return !(exchange.borrowerReview &&
        (exchange.borrowerReview.rating ||
          Object.keys(exchange.borrowerReview).length > 0));
    }

    return false;
  };

  const canFileComplaint = () => {
    return exchange && ['borrowed', 'returnRequested', 'returned', 'completed'].includes(exchange.status);
  };

  const renderExchangeActions = () => {
    if (!exchange) return null;

    return (
      <div className="exchange-actions">
        {canCancel() && (
          <button
            className="action-button cancel-button"
            onClick={() => {
              console.log('Cancel button clicked');
              showConfirmationModal('cancel', 'Are you sure you want to cancel this exchange?');
            }}
            disabled={actionLoading}
          >
            <FaTimesCircle /> Cancel Exchange
          </button>
        )}

        {canFileComplaint() && (
          <button
            className="action-button complaint-button"
            onClick={() => navigate(`/complaints/exchange/${exchange._id}`)}
            disabled={actionLoading}
          >
            <FaExclamationTriangle /> File Complaint
          </button>
        )}

        {canConfirmHandover() && (
          <button
            className="action-button confirm-button"
            onClick={() => showConfirmationModal('handover', 'Confirm that the book handover has taken place?')}
            disabled={actionLoading}
          >
            <FaHandshake /> Confirm Handover
          </button>
        )}

        {canMarkReturned() && (
          <button
            className="action-button return-button"
            onClick={() => {
              console.log('Book Returned button clicked');
              showConfirmationModal('markReturned', 'Mark this book as returned to the owner?');
            }}
            disabled={actionLoading}
          >
            <FaTruck /> Book Returned
          </button>
        )}

        {canConfirmReturn() && (
          <button
            className="action-button confirm-button"
            onClick={() => showConfirmationModal('return', 'Confirm that the book has been returned to you?')}
            disabled={actionLoading}
          >
            <FaUndo /> Confirm Return
          </button>
        )}        {canPayDeposit() && (
          <button
            className="action-button payment-button"
            onClick={() => showConfirmationModal('payDeposit', `Pay deposit of ₹${exchange.cautionDeposit.amount.toFixed(2)}?`)}
            disabled={actionLoading}
          >
            <FaCreditCard /> Pay Caution Deposit (₹{exchange.cautionDeposit.amount.toFixed(2)})
          </button>
        )}

        {canLeaveRating() && (
          <button
            className="action-button rating-button"
            onClick={() => setShowRatingModal(true)}
            disabled={actionLoading}
          >
            <FaStar /> Leave Rating
          </button>
        )}
      </div>
    );
  };

  const renderExchangeTimeline = () => {
    if (!exchange) return null;

    const steps = [
      {
        label: 'Request Sent',
        status: 'completed',
        date: formatDate(exchange.createdAt),
        icon: <FaExchangeAlt />
      },
      {
        label: exchange.status === 'rejected' ? 'Request Rejected' : 'Request Accepted',
        status: exchange.status === 'pending' ? 'current' : ['rejected', 'cancelled'].includes(exchange.status) ? 'rejected' : 'completed',
        date: exchange.status !== 'pending' ? formatDate(exchange.updatedAt) : '',
        icon: exchange.status === 'rejected' ? <FaTimesCircle /> : <FaCheckCircle />
      },
      {
        label: 'Book Borrowed',
        status: ['pending', 'accepted'].includes(exchange.status) ? 'upcoming' : ['rejected', 'cancelled'].includes(exchange.status) ? 'cancelled' : 'completed',
        date: exchange.borrowDate ? formatDate(exchange.borrowDate) : '',
        icon: <FaBook />
      }
    ];

    if (exchange.bookId.needsReturn) {
      // Add a return requested step
      if (['returnRequested', 'returned', 'completed'].includes(exchange.status)) {
        steps.push({
          label: 'Return Initiated',
          status: 'completed',
          date: exchange.returnRequestDate ? formatDate(exchange.returnRequestDate) : formatDate(exchange.updatedAt),
          icon: <FaTruck />
        });
      }

      steps.push({
        label: 'Book Returned',
        status: ['pending', 'accepted', 'borrowed', 'returnRequested'].includes(exchange.status) ? 'upcoming' : ['rejected', 'cancelled'].includes(exchange.status) ? 'cancelled' : 'completed',
        date: exchange.actualReturnDate ? formatDate(exchange.actualReturnDate) : '',
        icon: <FaUndo />
      });
    }

    steps.push({
      label: 'Exchange Completed',
      status: exchange.status === 'completed' ? 'completed' : ['rejected', 'cancelled'].includes(exchange.status) ? 'cancelled' : 'upcoming',
      date: exchange.status === 'completed' ? formatDate(exchange.updatedAt) : '',
      icon: <FaClipboardCheck />
    });

    return (
      <div className="exchange-timeline">
        <h3>Exchange Timeline</h3>
        <div className="timeline">
          {steps.map((step, index) => (
            <div key={index} className={`timeline-step ${step.status}`}>
              <div className="timeline-icon">
                {step.icon}
              </div>
              <div className="timeline-content">
                <div className="timeline-label">{step.label}</div>
                {step.date && <div className="timeline-date">{step.date}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderRatings = () => {
    if (!exchange) return null;

    // Debug the review data
    console.log('Owner review data:', exchange.ownerReview);
    console.log('Borrower review data:', exchange.borrowerReview);

    // Check if either review exists and has actual rating data
    const hasOwnerReview = exchange.ownerReview &&
      typeof exchange.ownerReview === 'object' &&
      exchange.ownerReview.rating;

    const hasBorrowerReview = exchange.borrowerReview &&
      typeof exchange.borrowerReview === 'object' &&
      exchange.borrowerReview.rating;

    if (!hasOwnerReview && !hasBorrowerReview) {
      console.log('No valid reviews found to display');
      return null;
    }

    return (
      <div className="exchange-ratings">
        <h3>Ratings</h3>

        {hasOwnerReview && (
          <div className="rating-card">
            <div className="rating-header">
              <div className="rater-info">
                <FaUser className="rater-icon" />
                <span className="rater-name">{exchange.ownerId.name} (Owner)</span>
              </div>
              <div className="rating-stars">
                {renderStars(exchange.ownerReview.rating)}
                <span className="rating-value">{exchange.ownerReview.rating.toFixed(1)}/5</span>
              </div>
            </div>
            {exchange.ownerReview.comment && (
              <div className="rating-comment">
                <FaCommentAlt className="comment-icon" />
                <p>{exchange.ownerReview.comment}</p>
              </div>
            )}
          </div>
        )}

        {hasBorrowerReview && (
          <div className="rating-card">
            <div className="rating-header">
              <div className="rater-info">
                <FaUser className="rater-icon" />
                <span className="rater-name">{exchange.borrowerId.name} (Borrower)</span>
              </div>
              <div className="rating-stars">
                {renderStars(exchange.borrowerReview.rating)}
                <span className="rating-value">{exchange.borrowerReview.rating.toFixed(1)}/5</span>
              </div>
            </div>
            {exchange.borrowerReview.comment && (
              <div className="rating-comment">
                <FaCommentAlt className="comment-icon" />
                <p>{exchange.borrowerReview.comment}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="exchange-details-loading">
        <div className="spinner"></div>
        <p>Loading exchange details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="exchange-details-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/exchanges')} className="back-button">
          <FaArrowLeft /> Back to Exchanges
        </button>
      </div>
    );
  }

  if (!exchange) {
    return (
      <div className="exchange-details-error">
        <h2>Exchange Not Found</h2>
        <p>The exchange you're looking for doesn't exist or you don't have permission to view it.</p>
        <button onClick={() => navigate('/exchanges')} className="back-button">
          <FaArrowLeft /> Back to Exchanges
        </button>
      </div>
    );
  }

  return (
    <div className="exchange-details-container">
      <div className="exchange-details-header">
        <button onClick={() => navigate('/exchanges')} className="back-button">
          <FaArrowLeft /> Back to Exchanges
        </button>
        <h1>Exchange Details</h1>
        <div className={`status-badge ${getStatusBadgeClass(exchange.status)}`}>
          {getStatusIcon(exchange.status)} {getStatusText(exchange.status)}
        </div>
      </div>

      <div className="exchange-details-content">
        <div className="exchange-book-section">
          <div className="book-image">
            <img
              src={exchange.bookId.image || '/default-book-cover.jpg'}
              alt={exchange.bookId.title}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/default-book-cover.jpg';
              }}
            />
          </div>

          <div className="book-details">
            <h2>{exchange.bookId.title}</h2>
            <p className="book-author">by {exchange.bookId.author}</p>

            <div className="book-return-policy">
              <span className={`return-badge ${exchange.bookId.needsReturn ? 'needs-return' : 'no-return'}`}>
                {exchange.bookId.needsReturn ? 'Needs Return' : 'No Return Required (Gift)'}
              </span>
            </div>

            <div className="exchange-people">
              <div className="exchange-person owner">
                <FaUser className="person-icon" />
                <span className="person-label">Owner:</span>
                <span className="person-name">{exchange.ownerId.name}</span>
                {isOwner() && <span className="person-you">(You)</span>}
              </div>

              <div className="exchange-person borrower">
                <FaUser className="person-icon" />
                <span className="person-label">Borrower:</span>
                <span className="person-name">{exchange.borrowerId.name}</span>
                {isBorrower() && <span className="person-you">(You)</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="exchange-details-grid">
          <div className="exchange-details-card">
            <h3>Exchange Details</h3>

            <div className="detail-item">
              <FaExchangeAlt className="detail-icon" />
              <span className="detail-label">Exchange Method:</span>
              <span className="detail-value">
                {exchange.exchangeMethod === 'in_person' ? 'In Person' :
                  exchange.exchangeMethod === 'mail' ? 'By Mail' :
                    exchange.exchangeMethod}
              </span>
            </div>

            {exchange.exchangeLocation && (
              <div className="detail-item">
                <FaMapMarkerAlt className="detail-icon" />
                <span className="detail-label">Exchange Location:</span>
                <span className="detail-value">{exchange.exchangeLocation}</span>
              </div>
            )}

            {exchange.bookId.needsReturn && (
              <div className="detail-item">
                <FaMoneyBillWave className="detail-icon" />
                <span className="detail-label">Caution Deposit:</span>
                <span className="detail-value">
                  ₹{exchange.cautionDeposit.amount.toFixed(2)}
                  <span className={`deposit-status ${exchange.cautionDeposit.paid ? 'paid' : 'unpaid'}`}>
                    {exchange.cautionDeposit.paid ?
                      (exchange.cautionDeposit.refunded ? 'Refunded' : 'Paid') :
                      'Unpaid'}
                  </span>
                </span>
              </div>
            )}

            <div className="detail-item">
              <FaCalendarAlt className="detail-icon" />
              <span className="detail-label">Request Date:</span>
              <span className="detail-value">{formatDate(exchange.createdAt)}</span>
            </div>

            {exchange.borrowDate && (
              <div className="detail-item">
                <FaCalendarAlt className="detail-icon" />
                <span className="detail-label">Borrow Date:</span>
                <span className="detail-value">{formatDate(exchange.borrowDate)}</span>
              </div>
            )}

            {exchange.expectedReturnDate && (
              <div className="detail-item">
                <FaCalendarAlt className="detail-icon" />
                <span className="detail-label">Expected Return Date:</span>
                <span className="detail-value highlight">{formatDate(exchange.expectedReturnDate)}</span>
              </div>
            )}

            {exchange.returnRequestDate && (
              <div className="detail-item">
                <FaCalendarAlt className="detail-icon" />
                <span className="detail-label">Return Initiated Date:</span>
                <span className="detail-value">{formatDate(exchange.returnRequestDate)}</span>
              </div>
            )}

            {exchange.actualReturnDate && (
              <div className="detail-item">
                <FaCalendarAlt className="detail-icon" />
                <span className="detail-label">Actual Return Date:</span>
                <span className="detail-value">{formatDate(exchange.actualReturnDate)}</span>
              </div>
            )}
          </div>

          {renderExchangeTimeline()}
        </div>

        {renderExchangeActions()}

        {renderRatings()}
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="modal-overlay">
          <div className="rating-modal">
            <div className="modal-header">
              <h2>Rate This Exchange</h2>
              <button
                className="close-modal-btn"
                onClick={() => setShowRatingModal(false)}
                disabled={actionLoading}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <p>Please rate your experience with this exchange.</p>

              <div className="rating-form">
                <div className="form-group">
                  <label>Your Rating:</label>
                  <div className="rating-input">
                    {renderStars(rating, true)}
                    <span className="rating-text">{rating}/5</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Comment (Optional):</label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your experience with this exchange..."
                    rows="4"
                    disabled={actionLoading}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="cancel-btn"
                onClick={() => setShowRatingModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className="submit-btn"
                onClick={handleSubmitRating}
                disabled={actionLoading}
              >
                {actionLoading ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complaint Modal */}
      {showComplaintModal && (
        <div className="modal-overlay">
          <div className="complaint-modal">
            <div className="modal-header">
              <h2>File a Complaint</h2>
              <button
                className="close-modal-btn"
                onClick={() => setShowComplaintModal(false)}
                disabled={actionLoading}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <p>Report an issue with this exchange to our admin team.</p>

              <div className="complaint-form">
                <div className="form-group">
                  <label>Category:</label>
                  <select
                    value={complaint.category}
                    onChange={(e) => setComplaint({ ...complaint, category: e.target.value })}
                    disabled={actionLoading}
                  >
                    <option value="behavior">Inappropriate Behavior</option>
                    <option value="book_condition">Book Condition Issues</option>
                    <option value="no_show">No Show/Late</option>
                    <option value="payment">Payment Issues</option>
                    <option value="communication">Communication Problems</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Subject:</label>
                  <input
                    type="text"
                    value={complaint.subject}
                    onChange={(e) => setComplaint({ ...complaint, subject: e.target.value })}
                    placeholder="Brief description of the issue"
                    disabled={actionLoading}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description:</label>
                  <textarea
                    value={complaint.description}
                    onChange={(e) => setComplaint({ ...complaint, description: e.target.value })}
                    placeholder="Provide detailed information about the issue..."
                    rows="4"
                    disabled={actionLoading}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="cancel-btn"
                onClick={() => setShowComplaintModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className="submit-btn"
                onClick={handleSubmitComplaint}
                disabled={actionLoading || !complaint.subject || !complaint.description}
              >
                {actionLoading ? 'Submitting...' : 'Submit Complaint'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <div className="modal-header">
              <h2>Confirm Action</h2>
              <button
                className="close-modal-btn"
                onClick={() => setShowConfirmModal(false)}
                disabled={actionLoading}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <p>{confirmMessage}</p>
            </div>

            <div className="modal-footer">
              <button
                className="cancel-btn"
                onClick={() => setShowConfirmModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className="confirm-btn"
                onClick={handleConfirmAction}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay">
          <PaymentModal
            amount={exchange?.cautionDeposit?.amount || 0}
            onSuccess={payDeposit}
            onCancel={() => setShowPaymentModal(false)}
          />
        </div>
      )}

      {/* Caution Deposit Alert - Borrower */}
      {exchange.bookId.needsReturn && isBorrower() && !exchange.cautionDeposit.paid && exchange.status === 'accepted' && (
        <div className="caution-deposit-alert">
          <FaExclamationTriangle className="alert-icon" />
          <div className="alert-content">
            <h4>Caution Deposit Required</h4>
            <p>Please pay the caution deposit of ₹{exchange.cautionDeposit.amount.toFixed(2)} to proceed with the book exchange.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExchangeDetails;