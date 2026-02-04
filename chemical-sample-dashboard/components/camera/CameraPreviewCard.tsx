"use client"



import { useEffect, useRef, useState } from "react"

import Image from "next/image"



type Props = {

  className?: string

  deviceId?: string

}



export default function CameraPreviewCard({ className, deviceId }: Props) {

  const videoRef = useRef<HTMLVideoElement | null>(null)

  const streamRef = useRef<MediaStream | null>(null)



  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")

  const [errorMsg, setErrorMsg] = useState("")



  useEffect(() => {

    let cancelled = false



    const stopStream = () => {

      if (streamRef.current) {

        streamRef.current.getTracks().forEach((t) => t.stop())

        streamRef.current = null

      }

    }



    const start = async () => {

      setStatus("loading")

      setErrorMsg("")



      if (!navigator.mediaDevices?.getUserMedia) {

        setStatus("error")

        setErrorMsg("브라우저에서 카메라 연결을 지원하지 않습니다.")

        return

      }



      try {

        stopStream()



        const constraints: MediaStreamConstraints = {

          video: deviceId ? { deviceId: { exact: deviceId } } : true,

          audio: false,

        }



        const stream = await navigator.mediaDevices.getUserMedia(constraints)



        if (cancelled) {

          stream.getTracks().forEach((t) => t.stop())

          return

        }



        streamRef.current = stream



        if (videoRef.current) {

          videoRef.current.srcObject = stream

          await videoRef.current.play().catch(() => {})

        }



        setStatus("ready")

      } catch (e: any) {

        setStatus("error")

        const name = e?.name || ""

        if (name === "NotAllowedError") setErrorMsg("카메라 권한이 거부되었습니다.")

        else if (name === "NotFoundError") setErrorMsg("사용 가능한 카메라가 없습니다.")

        else if (name === "NotReadableError") setErrorMsg("다른 앱이 카메라를 사용 중입니다.")

        else setErrorMsg("카메라를 여는 중 오류가 발생했습니다.")

      }

    }



    start()



    return () => {

      cancelled = true

      stopStream()

    }

  }, [deviceId])



  return (

    <div className={className}>

      <div className="rounded-2xl border bg-card p-3 text-card-foreground shadow-sm">

        <div className="mb-0.5 flex items-center justify-between">

          <div className="text-sm font-semibold">카메라 연결</div>

          <div className="mb-0.5 flex items-center justify-between">

            {status === "ready" ? (

              <Image

                src="/live.png"

                alt="LIVE"

                width={110}

                height={42}

                className="h-8 w-auto"

                priority

              />

            ) : status === "loading" ? (

              <span className="text-xs text-muted-foreground">로딩 중...</span>

            ) : (

              <span className="text-xs text-destructive">연결 실패</span>

            )}

          </div>

        </div>



        <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">

          {status === "error" ? (

            <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-white/80">

              {errorMsg}

            </div>

          ) : (

            <video ref={videoRef} className="h-full w-full object-cover" muted playsInline autoPlay />

          )}

        </div>

      </div>

    </div>

  )

}

