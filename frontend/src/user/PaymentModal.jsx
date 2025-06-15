import React, { useState } from 'react';
import { 
  FaCreditCard, 
  FaMoneyBillWave, 
  FaLock, 
  FaCheckCircle,
  FaTimesCircle
} from 'react-icons/fa';
import './PaymentModal.css';

const PaymentModal = ({ amount, onSuccess, onCancel }) => {
  const [paymentStep, setPaymentStep] = useState('details'); // 'details', 'processing', 'success', 'error'
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  });
  const [formErrors, setFormErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Format credit card number with spaces after every 4 digits
    if (name === 'cardNumber') {
      formattedValue = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim().slice(0, 19);
    }
    
    // Format expiry date as MM/YY
    if (name === 'expiryDate') {
      formattedValue = value.replace(/\D/g, '');
      if (formattedValue.length > 2) {
        formattedValue = formattedValue.slice(0, 2) + '/' + formattedValue.slice(2, 4);
      }
    }
    
    // Limit CVV to 3 or 4 digits
    if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }

    setFormData({ ...formData, [name]: formattedValue });
    
    // Clear error for this field if it exists
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: null });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Validate card number (16 digits)
    const cardNumberDigits = formData.cardNumber.replace(/\s/g, '');
    if (!cardNumberDigits || cardNumberDigits.length !== 16 || !/^\d+$/.test(cardNumberDigits)) {
      errors.cardNumber = 'Please enter a valid 16-digit card number';
    }
    
    // Validate card name
    if (!formData.cardName.trim()) {
      errors.cardName = 'Please enter the cardholder name';
    }
    
    // Validate expiry date (MM/YY format)
    if (!formData.expiryDate || !/^\d{2}\/\d{2}$/.test(formData.expiryDate)) {
      errors.expiryDate = 'Please enter a valid expiry date (MM/YY)';
    } else {
      // Check if card is expired
      const [month, year] = formData.expiryDate.split('/');
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear() % 100; // Get last 2 digits
      const currentMonth = currentDate.getMonth() + 1; // getMonth() is 0-indexed
      
      if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
        errors.expiryDate = 'Card has expired';
      }
    }
    
    // Validate CVV (3 or 4 digits)
    if (!formData.cvv || !/^\d{3,4}$/.test(formData.cvv)) {
      errors.cvv = 'Please enter a valid CVV code';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Start payment processing
      setPaymentStep('processing');
      
      // Simulate payment processing delay
      setTimeout(() => {
        const isSuccess = Math.random() > 0.2; // 80% success rate for demonstration
        
        if (isSuccess) {
          setPaymentStep('success');
          // Wait for animation before dismissing
          setTimeout(() => {
            onSuccess();
          }, 2000);
        } else {
          setPaymentStep('error');
        }
      }, 2000);
    }
  };

  const handleTryAgain = () => {
    setPaymentStep('details');
  };

  return (
    <div className="payment-modal">
      <div className="payment-header">
        <h2>
          <FaMoneyBillWave /> Caution Deposit Payment
        </h2>
        <div className="payment-amount">
          <span className="amount-label">Amount:</span>
          <span className="amount-value">Rs.{amount.toFixed(2)}</span>
        </div>
      </div>
      
      <div className="payment-content">
        {paymentStep === 'details' && (
          <form onSubmit={handleSubmit} className="payment-form">
            <div className="secure-notice">
              <FaLock /> Secure payment - Your card details are encrypted
            </div>
            
            <div className={`form-group ${formErrors.cardNumber ? 'has-error' : ''}`}>
              <label htmlFor="cardNumber">Card Number</label>
              <div className="card-input">
                <FaCreditCard className="input-icon" />
                <input
                  type="text"
                  id="cardNumber"
                  name="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  maxLength={19}
                />
              </div>
              {formErrors.cardNumber && <div className="error-message">{formErrors.cardNumber}</div>}
            </div>
            
            <div className={`form-group ${formErrors.cardName ? 'has-error' : ''}`}>
              <label htmlFor="cardName">Cardholder Name</label>
              <input
                type="text"
                id="cardName"
                name="cardName"
                placeholder="John Smith"
                value={formData.cardName}
                onChange={handleInputChange}
              />
              {formErrors.cardName && <div className="error-message">{formErrors.cardName}</div>}
            </div>
            
            <div className="form-row">
              <div className={`form-group ${formErrors.expiryDate ? 'has-error' : ''}`}>
                <label htmlFor="expiryDate">Expiry Date</label>
                <input
                  type="text"
                  id="expiryDate"
                  name="expiryDate"
                  placeholder="MM/YY"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  maxLength={5}
                />
                {formErrors.expiryDate && <div className="error-message">{formErrors.expiryDate}</div>}
              </div>
              
              <div className={`form-group ${formErrors.cvv ? 'has-error' : ''}`}>
                <label htmlFor="cvv">CVV</label>
                <input
                  type="text"
                  id="cvv"
                  name="cvv"
                  placeholder="123"
                  value={formData.cvv}
                  onChange={handleInputChange}
                  maxLength={4}
                />
                {formErrors.cvv && <div className="error-message">{formErrors.cvv}</div>}
              </div>
            </div>
            
            <div className="payment-note">
              <p>
                This deposit will be refunded when the book is returned and confirmed by the owner.
              </p>
            </div>
            
            <div className="form-actions">
              <button type="button" className="cancel-button" onClick={onCancel}>
                Cancel
              </button>
              <button type="submit" className="pay-button">
                Pay Rs.{amount.toFixed(2)}
              </button>
            </div>
          </form>
        )}
        
        {paymentStep === 'processing' && (
          <div className="payment-processing">
            <div className="processing-spinner"></div>
            <h3>Processing Payment</h3>
            <p>Please wait while we process your payment...</p>
          </div>
        )}
        
        {paymentStep === 'success' && (
          <div className="payment-result success">
            <div className="result-icon success">
              <FaCheckCircle />
            </div>
            <h3>Payment Successful!</h3>
            <p>Your deposit has been processed successfully.</p>
            <p>You can now proceed with the book exchange.</p>
          </div>
        )}
        
        {paymentStep === 'error' && (
          <div className="payment-result error">
            <div className="result-icon error">
              <FaTimesCircle />
            </div>
            <h3>Payment Failed</h3>
            <p>Sorry, there was a problem processing your payment.</p>
            <button className="try-again-button" onClick={handleTryAgain}>
              Try Again
            </button>
            <button className="cancel-button" onClick={onCancel}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;