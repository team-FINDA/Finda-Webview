export {}

declare global {
  interface Window {
    AndroidQR?: {
      postMessage: (message: string) => void
    }
    webkit?: {
      messageHandlers?: {
        IOSQR?: {
          postMessage: (message: {
            type: 'QR_SCAN_SUCCESS'
            value: string
          }) => void
        }
      }
    }
    QRScannerWebView?: {
      resumeScan: () => void
      showResult: (
        result:
          | string
          | {
              success: boolean
              message: string
            },
      ) => void
    }
  }
}
