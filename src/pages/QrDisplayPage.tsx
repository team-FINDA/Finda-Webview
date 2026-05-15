import styled from '@emotion/styled'
import { QRCodeSVG } from 'qrcode.react'
import { useSearchParams } from 'react-router-dom'

function QrDisplayPage() {
  const [searchParams] = useSearchParams()
  const qrValue = searchParams.get('value') ?? ''

  return (
    <QrDisplayScreen>
      {qrValue ? (
        <QrDisplayCode
          value={qrValue}
          size={256}
          bgColor="#ffffff"
          fgColor="#000000"
          level="M"
          includeMargin={false}
        />
      ) : (
        <QrDisplayEmpty>QR 데이터가 없습니다.</QrDisplayEmpty>
      )}
    </QrDisplayScreen>
  )
}

export default QrDisplayPage

const QrDisplayScreen = styled.main`
  width: 100%;
  height: 100svh;
  display: grid;
  place-items: center;
  padding: 0;
  background: #ffffff;
`

const QrDisplayCode = styled(QRCodeSVG)`
  display: block;
  width: min(100vw, 100svh);
  max-width: 100%;
  height: auto;
  max-height: 100svh;
`

const QrDisplayEmpty = styled.p`
  color: #222832;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
  text-align: center;
`
