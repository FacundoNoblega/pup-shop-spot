import { useState } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle, MessageCircle } from 'lucide-react';
import '../../styles/grooming-wizard.css';

type DeliveryType = 'local' | 'domicilio';
type DayOfWeek = 'L' | 'M' | 'Mi' | 'J' | 'V';
type DogSize = 'pequeño' | 'mediano' | 'grande';
type CutType = 'higiene' | 'estándar' | 'completo' | 'deslanado';

interface GroomingData {
  deliveryType: DeliveryType | null;
  address: string;
  dogSize: DogSize | null;
  cutType: CutType | null;
  dayOfWeek: DayOfWeek | null;
}

const DAYS: DayOfWeek[] = ['L', 'M', 'Mi', 'J', 'V'];
const SIZES: { value: DogSize; label: string }[] = [
  { value: 'pequeño', label: '🐕 Pequeño (< 10kg)' },
  { value: 'mediano', label: '🐕 Mediano (10-20kg)' },
  { value: 'grande', label: '🐕 Grande (> 20kg)' },
];
const CUT_TYPES: { value: CutType; label: string }[] = [
  { value: 'higiene', label: '✂️ Higiene' },
  { value: 'estándar', label: '✂️ Corte Estándar' },
  { value: 'completo', label: '✂️ Corte Completo' },
  { value: 'deslanado', label: '✂️ Deslanado' },
];

export function GroomingWizard() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<GroomingData>({
    deliveryType: null,
    address: '',
    dogSize: null,
    cutType: null,
    dayOfWeek: null,
  });
  const [submitted, setSubmitted] = useState(false);

  const isStepValid = (): boolean => {
    switch (step) {
      case 1:
        return data.deliveryType !== null;
      case 2:
        return data.deliveryType === 'domicilio' ? data.address.trim() !== '' : true;
      case 3:
        return data.dogSize !== null && data.cutType !== null;
      case 4:
        return data.dayOfWeek !== null;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (isStepValid() && step < 5) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = () => {
    const dogSizeLabel = SIZES.find(s => s.value === data.dogSize)?.label || data.dogSize;
    const cutTypeLabel = CUT_TYPES.find(c => c.value === data.cutType)?.label || data.cutType;
    const dayLabel = `${data.dayOfWeek}`;

    let message = `Hola! Quiero agendar una cita de peluquería canina:\n\n`;
    message += `📍 *Tipo de servicio:* ${data.deliveryType === 'local' ? 'Retiro en el local' : 'Retiro a domicilio'}\n`;

    if (data.deliveryType === 'domicilio') {
      message += `📮 *Dirección:* ${data.address}\n`;
    }

    message += `🐕 *Tamaño del perro:* ${dogSizeLabel}\n`;
    message += `✂️ *Tipo de corte:* ${cutTypeLabel}\n`;
    message += `📅 *Día preferido:* ${dayLabel}\n\n`;
    message += `¡Gracias! Confirmen disponibilidad.`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/5493834701332?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
    setSubmitted(true);
  };

  const resetForm = () => {
    setStep(1);
    setData({
      deliveryType: null,
      address: '',
      dogSize: null,
      cutType: null,
      dayOfWeek: null,
    });
    setSubmitted(false);
  };

  return (
    <div className="grooming-wizard-container">
      <div className="wizard-card">
        {!submitted ? (
          <>
            {/* Header */}
            <div className="wizard-header">
              <h3 className="wizard-title">🐽 Peluquería Canina</h3>
              <p className="wizard-subtitle">Agende su turno en 4 pasos</p>
              <div className="progress-bar">
                {[1, 2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className={`progress-dot ${s <= step ? 'active' : ''}`}
                  ></div>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="wizard-content">
              {/* Step 1: Delivery Type */}
              {step === 1 && (
                <div className="step-content">
                  <h4 className="step-title">¿Dónde lo recibimos?</h4>
                  <div className="options-grid">
                    <button
                      onClick={() => {
                        setData({ ...data, deliveryType: 'local' });
                      }}
                      className={`option-card ${data.deliveryType === 'local' ? 'selected' : ''}`}
                    >
                      <span className="option-icon">🏪</span>
                      <span className="option-text">En el local</span>
                    </button>
                    <button
                      onClick={() => {
                        setData({ ...data, deliveryType: 'domicilio' });
                      }}
                      className={`option-card ${data.deliveryType === 'domicilio' ? 'selected' : ''}`}
                    >
                      <span className="option-icon">🚚</span>
                      <span className="option-text">A domicilio</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Address (conditional) */}
              {step === 2 && data.deliveryType === 'domicilio' && (
                <div className="step-content">
                  <h4 className="step-title">¿Cuál es tu dirección?</h4>
                  <input
                    type="text"
                    placeholder="Ej: Calle San Martín 123, apto 4"
                    value={data.address}
                    onChange={(e) => setData({ ...data, address: e.target.value })}
                    className="wizard-input"
                    autoFocus
                  />
                </div>
              )}

              {/* Step 3: Dog Size and Cut Type */}
              {step === 3 && (
                <div className="step-content">
                  <div className="step-section">
                    <h4 className="step-title">Tamaño del perro</h4>
                    <div className="options-grid">
                      {SIZES.map((size) => (
                        <button
                          key={size.value}
                          onClick={() => setData({ ...data, dogSize: size.value })}
                          className={`option-card ${data.dogSize === size.value ? 'selected' : ''}`}
                        >
                          <span className="option-text">{size.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="step-section">
                    <h4 className="step-title">Tipo de corte</h4>
                    <div className="options-grid">
                      {CUT_TYPES.map((cut) => (
                        <button
                          key={cut.value}
                          onClick={() => setData({ ...data, cutType: cut.value })}
                          className={`option-card ${data.cutType === cut.value ? 'selected' : ''}`}
                        >
                          <span className="option-text">{cut.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Day of Week */}
              {step === 4 && (
                <div className="step-content">
                  <h4 className="step-title">¿Qué día prefieres?</h4>
                  <div className="days-grid">
                    {DAYS.map((day) => (
                      <button
                        key={day}
                        onClick={() => setData({ ...data, dayOfWeek: day })}
                        className={`day-button ${data.dayOfWeek === day ? 'selected' : ''}`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Summary (Step 5) */}
            {step === 5 && (
              <div className="wizard-content">
                <div className="summary-header">
                  <CheckCircle size={40} className="summary-icon" />
                  <h4>Resumen del Turno</h4>
                </div>

                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="summary-label">Servicio</span>
                    <span className="summary-value">
                      {data.deliveryType === 'local' ? '🏪 En el local' : '🚚 A domicilio'}
                    </span>
                  </div>

                  {data.deliveryType === 'domicilio' && (
                    <div className="summary-item">
                      <span className="summary-label">Dirección</span>
                      <span className="summary-value">{data.address}</span>
                    </div>
                  )}

                  <div className="summary-item">
                    <span className="summary-label">Tamaño</span>
                    <span className="summary-value">
                      {SIZES.find(s => s.value === data.dogSize)?.label}
                    </span>
                  </div>

                  <div className="summary-item">
                    <span className="summary-label">Corte</span>
                    <span className="summary-value">
                      {CUT_TYPES.find(c => c.value === data.cutType)?.label}
                    </span>
                  </div>

                  <div className="summary-item">
                    <span className="summary-label">Día</span>
                    <span className="summary-value">📅 {data.dayOfWeek}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="wizard-footer">
              <button
                onClick={handlePrev}
                disabled={step === 1}
                className="wizard-btn btn-secondary"
              >
                <ChevronLeft size={18} />
                Atrás
              </button>

              {step < 5 ? (
                <button
                  onClick={handleNext}
                  disabled={!isStepValid()}
                  className="wizard-btn btn-primary"
                >
                  Siguiente
                  <ChevronRight size={18} />
                </button>
              ) : (
                <button onClick={handleSubmit} className="wizard-btn btn-success">
                  <MessageCircle size={18} />
                  Enviar por WhatsApp
                </button>
              )}
            </div>
          </>
        ) : (
          /* Success State */
          <div className="success-state">
            <div className="success-icon">✅</div>
            <h4>¡Perfecto!</h4>
            <p>Tu mensaje ha sido enviado a WhatsApp.</p>
            <p className="success-subtext">Pronto nos contactaremos para confirmar tu turno.</p>
            <button onClick={resetForm} className="wizard-btn btn-primary">
              Agendar otro turno
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
