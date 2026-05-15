import { keyframes } from '@emotion/react'
import styled from '@emotion/styled'
import CheckOne from '@icon-park/react/es/icons/CheckOne'
import CloseOne from '@icon-park/react/es/icons/CloseOne'
import { useCallback, useEffect, useRef, useState } from 'react'
import QrScanner from 'qr-scanner'

type ScannerStatus = 'starting' | 'scanning' | 'processing' | 'completed' | 'error'

type ApiResultPayload = {
  success: boolean
  message: string
}

type ApiResultModal = {
  success: boolean
  message: string
}

type QrScanSuccessMessage = {
  type: 'QR_SCAN_SUCCESS'
  value: string
}

type CornerPlacement = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

const QR_SUCCESS_TYPE = 'QR_SCAN_SUCCESS'

function getCameraErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
      return '카메라 권한이 거부되었습니다.'
    }

    if (error.name === 'NotFoundError' || error.name === 'OverconstrainedError') {
      return '사용 가능한 카메라를 찾을 수 없습니다.'
    }

    if (error.name === 'NotReadableError') {
      return '카메라를 열 수 없습니다. 다른 앱에서 카메라를 사용 중인지 확인해주세요.'
    }
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return '카메라를 시작할 수 없습니다.'
}

function sendScanResult(qrValue: string): boolean {
  const message: QrScanSuccessMessage = {
    type: QR_SUCCESS_TYPE,
    value: qrValue,
  }
  const androidPostMessage = window.AndroidQR?.postMessage

  if (typeof androidPostMessage === 'function') {
    androidPostMessage.call(window.AndroidQR, JSON.stringify(message))
    return true
  }

  const iosMessageHandler = window.webkit?.messageHandlers?.IOSQR

  if (typeof iosMessageHandler?.postMessage === 'function') {
    iosMessageHandler.postMessage(message)
    return true
  }

  console.log(JSON.stringify(message))
  return false
}

function hasNativeQrBridge(): boolean {
  return (
    typeof window.AndroidQR?.postMessage === 'function' ||
    typeof window.webkit?.messageHandlers?.IOSQR?.postMessage === 'function'
  )
}
function formatApiResult(result: ApiResultPayload | string): ApiResultModal {
  if (typeof result === 'string') {
    try {
      const parsedResult = JSON.parse(result) as unknown

      if (parsedResult && typeof parsedResult === 'object') {
        return formatApiResult(parsedResult as ApiResultPayload)
      }
    } catch {
      return {
        success: true,
        message: result,
      }
    }

    return {
      success: true,
      message: result,
    }
  }

  return {
    success: result.success,
    message: result.message,
  }
}

function QrScanPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const scannerRef = useRef<QrScanner | null>(null)
  const handlingResultRef = useRef(false)
  const [status, setStatus] = useState<ScannerStatus>('starting')
  const [errorMessage, setErrorMessage] = useState('')
  const [scanResult, setScanResult] = useState('')
  const [apiResultModal, setApiResultModal] = useState<ApiResultModal | null>(null)
  const [scanKey, setScanKey] = useState(0)

  const isBridgeAvailable = hasNativeQrBridge()
  const isProcessing = status === 'processing'
  const isCompleted = status === 'completed'
  const hasError = status === 'error'

  const resumeScan = useCallback(() => {
    handlingResultRef.current = false
    void videoRef.current?.play().catch((error: unknown) => {
      console.warn(error)
    })
    setScanResult('')
    setErrorMessage('')
    setApiResultModal(null)
    setStatus('scanning')
  }, [])

  const showResult = useCallback((result: ApiResultPayload | string) => {
    setApiResultModal(formatApiResult(result))
    setStatus('completed')
  }, [])

  useEffect(() => {
    window.QRScannerWebView = {
      resumeScan,
      showResult,
    }

    return () => {
      if (
        window.QRScannerWebView?.resumeScan === resumeScan &&
        window.QRScannerWebView?.showResult === showResult
      ) {
        delete window.QRScannerWebView
      }
    }
  }, [resumeScan, showResult])

  useEffect(() => {
    const videoElement = videoRef.current

    if (!videoElement) {
      return undefined
    }

    let isMounted = true
    let isDestroyed = false
    handlingResultRef.current = false
    setStatus('starting')
    setErrorMessage('')
    setScanResult('')

    const scanner = new QrScanner(
      videoElement,
      (result) => {
        if (handlingResultRef.current) {
          return
        }

        handlingResultRef.current = true
        videoElement.pause()

        if (!isMounted) {
          return
        }

        setScanResult(result.data)
        setStatus(sendScanResult(result.data) ? 'processing' : 'completed')
      },
      {
        preferredCamera: 'environment',
        maxScansPerSecond: 8,
        returnDetailedScanResult: true,
        highlightScanRegion: false,
        highlightCodeOutline: false,
        onDecodeError: (error) => {
          if (error !== QrScanner.NO_QR_CODE_FOUND) {
            console.warn(error)
          }
        },
      },
    )

    const destroyScanner = () => {
      if (isDestroyed) {
        return
      }

      scanner.stop()
      scanner.destroy()
      isDestroyed = true
    }

    scannerRef.current = scanner

    scanner
      .start()
      .then(() => {
        if (isMounted) {
          setStatus('scanning')
        }
      })
      .catch((error: unknown) => {
        destroyScanner()

        if (!isMounted) {
          return
        }

        setStatus('error')
        setErrorMessage(getCameraErrorMessage(error))
      })

    return () => {
      isMounted = false
      handlingResultRef.current = true
      destroyScanner()

      if (scannerRef.current === scanner) {
        scannerRef.current = null
      }
    }
  }, [scanKey])

  const restartScanner = () => {
    scannerRef.current?.stop()
    setScanKey((currentKey) => currentKey + 1)
  }

  return (
    <QrScreen>
      <QrVideo
        ref={videoRef}
        muted
        playsInline
        autoPlay
        aria-label="QR scanner camera preview"
      />

      <QrOverlay aria-hidden="true">
        <QrGuide>
          <QrCorner $placement="top-left" />
          <QrCorner $placement="top-right" />
          <QrCorner $placement="bottom-left" />
          <QrCorner $placement="bottom-right" />
        </QrGuide>
      </QrOverlay>

      {isProcessing && (
        <QrProcessingOverlay aria-live="polite">
          <QrSpinner aria-hidden="true" />
          <QrProcessingText>QR 확인 중입니다</QrProcessingText>
        </QrProcessingOverlay>
      )}

      <QrBottomPanel aria-live="polite">
        {status === 'scanning' && <QrHelp>QR 코드를 화면 중앙에 맞춰주세요</QrHelp>}

        {hasError && (
          <QrMessage>
            <QrMessageText>{errorMessage}</QrMessageText>
            <QrButton type="button" onClick={restartScanner}>
              다시 시도
            </QrButton>
          </QrMessage>
        )}

        {isCompleted && !apiResultModal && (
          <QrMessage>
            {!isBridgeAvailable && (
              <QrResult>
                <span>스캔 결과</span>
                <p>{scanResult}</p>
              </QrResult>
            )}
            <QrButton type="button" onClick={restartScanner}>
              다시 스캔
            </QrButton>
          </QrMessage>
        )}
      </QrBottomPanel>

      {apiResultModal && (
        <QrModalBackdrop role="dialog" aria-modal="true" aria-labelledby="qr-result-title">
          <QrModal $success={apiResultModal.success}>
            <QrModalIcon aria-hidden="true">
              {apiResultModal.success ? (
                <CheckOne theme="outline" size="76" fill="#6686FF" />
              ) : (
                <CloseOne theme="outline" size="76" fill="#F12525" />
              )}
            </QrModalIcon>
            <QrModalTitle id="qr-result-title">
              {apiResultModal.success ? '출석 완료!' : '출석 실패'}
            </QrModalTitle>
            <QrModalDescription>{apiResultModal.message}</QrModalDescription>
            <QrModalButton type="button" onClick={resumeScan}>
              확인
            </QrModalButton>
          </QrModal>
        </QrModalBackdrop>
      )}
    </QrScreen>
  )
}

export default QrScanPage

const qrSpin = keyframes`
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
`

const QrScreen = styled.main`
  position: relative;
  width: 100%;
  height: 100svh;
  min-height: 100vh;
  overflow: hidden;
  color: #ffffff;
  background: #05070d;
`

const QrVideo = styled.video`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #05070d;
`

const QrOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;
`

const QrGuide = styled.div`
  position: relative;
  width: min(72vw, 42svh, 340px);
  min-width: 220px;
  aspect-ratio: 1;
  border: 1px solid rgba(255, 255, 255, 0.46);
  border-radius: 18px;
  box-shadow: 0 0 0 9999px rgba(4, 7, 13, 0.58);

  &::after {
    content: '';
    position: absolute;
    inset: 11%;
    border: 1px dashed rgba(255, 255, 255, 0.28);
    border-radius: 12px;
  }

  @media (orientation: landscape) and (max-height: 520px) {
    width: min(44vw, 58svh, 260px);
    min-width: 180px;
  }
`

const QrCorner = styled.span<{ $placement: CornerPlacement }>`
  position: absolute;
  width: 46px;
  height: 46px;

  ${({ $placement }) => {
    switch ($placement) {
      case 'top-left':
        return `
          top: -2px;
          left: -2px;
          border-top: 5px solid var(--qr-primary);
          border-left: 5px solid var(--qr-primary);
          border-top-left-radius: 18px;
        `
      case 'top-right':
        return `
          top: -2px;
          right: -2px;
          border-top: 5px solid var(--qr-primary);
          border-right: 5px solid var(--qr-primary);
          border-top-right-radius: 18px;
        `
      case 'bottom-left':
        return `
          bottom: -2px;
          left: -2px;
          border-bottom: 5px solid var(--qr-primary);
          border-left: 5px solid var(--qr-primary);
          border-bottom-left-radius: 18px;
        `
      case 'bottom-right':
        return `
          right: -2px;
          bottom: -2px;
          border-right: 5px solid var(--qr-primary);
          border-bottom: 5px solid var(--qr-primary);
          border-bottom-right-radius: 18px;
        `
    }
  }}
`

const QrBottomPanel = styled.section`
  position: absolute;
  right: max(16px, env(safe-area-inset-right));
  bottom: max(22px, env(safe-area-inset-bottom));
  left: max(16px, env(safe-area-inset-left));
  z-index: 2;
  display: flex;
  justify-content: center;
`

const QrProcessingOverlay = styled.section`
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
`

const QrSpinner = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 255, 255, 0.28);
  border-top-color: var(--qr-primary);
  border-radius: 50%;
  transform: translate(-50%, -50%) rotate(0deg);
  animation: ${qrSpin} 0.8s linear infinite;
`

const QrProcessingText = styled.p`
  position: absolute;
  top: calc(50% + 40px);
  left: 50%;
  width: 100%;
  color: rgba(255, 255, 255, 0.94);
  font-size: 15px;
  font-weight: 700;
  line-height: 1.3;
  text-align: center;
  transform: translateX(-50%);
`

const QrMessage = styled.div`
  width: min(100%, 420px);
  display: grid;
  gap: 14px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 18px;
  background: rgba(5, 8, 14, 0.72);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(16px);

  @media (orientation: landscape) and (max-height: 520px) {
    padding: 12px;
  }
`

const QrHelp = styled.p`
  width: min(100%, 360px);
  padding: 0;
  border: 0;
  color: #ffffff;
  background: transparent;
  box-shadow: none;
  backdrop-filter: none;
  text-align: center;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.72);
  font-size: 15px;
  font-weight: 700;
  line-height: 1.35;

  @media (orientation: landscape) and (max-height: 520px) {
    padding: 12px;
  }
`

const QrMessageText = styled.p`
  color: rgba(255, 255, 255, 0.92);
  font-size: 15px;
  font-weight: 600;
  line-height: 1.45;
`

const QrResult = styled.div`
  display: grid;
  min-width: 0;
  gap: 7px;

  span {
    color: var(--qr-primary);
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0;
    line-height: 1.2;
  }

  p {
    max-height: 112px;
    overflow: auto;
    color: #ffffff;
    font-family: var(--sans);
    font-size: 14px;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }
`

const QrButton = styled.button`
  width: 100%;
  min-height: 48px;
  border: 0;
  border-radius: 12px;
  color: #ffffff;
  background: var(--qr-primary);
  cursor: pointer;
  font-size: 16px;
  font-weight: 800;
  line-height: 1.2;

  &:active {
    transform: translateY(1px);
  }

  &:focus-visible {
    outline: 3px solid rgba(46, 86, 245, 0.42);
    outline-offset: 3px;
  }
`

const QrModalBackdrop = styled.section`
  position: absolute;
  inset: 0;
  z-index: 3;
  display: grid;
  place-items: center;
  padding:
    max(16px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right))
    max(16px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left));
  background: rgba(0, 0, 0, 0.18);
`

const QrModal = styled.div<{ $success: boolean }>`
  --qr-result-color: ${({ $success }) =>
    $success ? 'var(--qr-success)' : 'var(--qr-fail)'};

  width: min(100%, 250px);
  max-height: 200px;
  display: grid;
  justify-items: center;
  gap: 0;
  padding: 14px;
  border: 1px solid #222222;
  border-radius: 18px;
  color: #000000;
  background: #ffffff;
  box-shadow: none;
`

const QrModalIcon = styled.div`
  display: grid;
  place-items: center;
  width: 76px;
  height: 76px;
  margin-bottom: 5px;
  color: var(--qr-result-color);
`

const QrModalTitle = styled.h2`
  margin: 0 0 5px;
  color: #000000;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: 0;
`

const QrModalDescription = styled.p`
  color: #3f3f46;
  font-size: 10px;
  font-weight: 400;
  line-height: 1.5;
  text-align: center;
  overflow-wrap: anywhere;
`

const QrModalButton = styled(QrButton)`
  min-height: 38px;
  margin-top: 15px;
  border-radius: 999px;
  background: var(--qr-result-color);
  font-size: 12px;
  font-weight: 600;
`
