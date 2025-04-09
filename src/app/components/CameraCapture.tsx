"use client";

import { useRef, useState, useEffect } from "react";
import { FaDownload, FaStop, FaPlay, FaVideo, FaSync } from "react-icons/fa";

export default function CameraCapture() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textOverlayRef = useRef<HTMLDivElement>(null); // Referência para a div do texto
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [useFrontCamera, setUseFrontCamera] = useState(false);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(9); // Contagem regressiva de 9s
  const [currentTime, setCurrentTime] = useState(""); // Timestamp atualizado
  const [isProcessing, setIsProcessing] = useState(false); // Estado para controlar o processamento do vídeo
  const [stopedCamera, setStopedCamera] = useState(false);
  const [isClient, setIsClient] = useState(false); // Flag to track if we're on client side

  // Set isClient to true when component mounts (client-side only)
  useEffect(() => {
    setIsClient(true);
    // Set initial time
    setCurrentTime(new Date().toLocaleString());
  }, []);

  // Atualiza o timestamp a cada segundo (only on client side)
  useEffect(() => {
    if (!isClient) return;

    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000);
    return () => clearInterval(timer);
  }, [isClient]);

  // Inicia a câmera
  const startCamera = async () => {
    // Se houver um vídeo gravado anteriormente, recarrega a página
    if (recordedVideo) {
      window.location.reload();
      return;
    }

    setIsCameraActive(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: useFrontCamera ? "user" : "environment" },
        audio: true, // Habilita áudio para gravação
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
    } catch (err) {
      console.error("Erro ao acessar a câmera:", err);
    }
  };

  // Alterna entre câmeras
  const toggleCamera = () => {
    setUseFrontCamera(!useFrontCamera);
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      startCamera();
    }
  };

  // Processa o vídeo com Canvas
  const processVideoWithCanvas = async (blob: Blob) => {
    setIsProcessing(true); // Inicia o indicador de processamento
    return new Promise<string>((resolve, reject) => {
      try {
        // Criar elementos de vídeo e canvas
        const video = document.createElement("video");
        video.src = URL.createObjectURL(blob);

        // Criar um canvas para processar os frames
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { alpha: false });

        if (!ctx) {
          setIsProcessing(false); // Para o indicador de processamento em caso de erro
          reject(new Error("Não foi possível obter o contexto do canvas"));
          return;
        }

        // Configurar o MediaRecorder para capturar os frames processados
        const processedChunks: Blob[] = [];
        let mediaRecorder: MediaRecorder | null = null;

        // Quando o vídeo estiver carregado
        video.onloadedmetadata = () => {
          // Configurar o canvas com as dimensões do vídeo
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          // Criar um stream de canvas para o MediaRecorder com taxa de quadros mais alta
          const canvasStream = canvas.captureStream(60); // 60 FPS para melhor qualidade

          // Adicionar o áudio original do vídeo ao stream do canvas
          const audioTracks =
            (video as HTMLVideoElement & { captureStream?: () => MediaStream })
              .captureStream?.()
              ?.getAudioTracks() || [];
          if (audioTracks.length > 0) {
            audioTracks.forEach((track: MediaStreamTrack) => {
              canvasStream.addTrack(track);
            });
          }

          // Configurar o MediaRecorder para gravar o stream do canvas com alta qualidade
          mediaRecorder = new MediaRecorder(canvasStream, {
            mimeType: "video/webm;codecs=vp9",
            videoBitsPerSecond: 8000000, // 8 Mbps para alta qualidade
          });

          // Coletar os chunks de vídeo processado
          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              processedChunks.push(e.data);
            }
          };

          // Quando a gravação terminar, criar o vídeo final
          mediaRecorder.onstop = () => {
            const processedBlob = new Blob(processedChunks, {
              type: "video/webm",
            });
            const processedUrl = URL.createObjectURL(processedBlob);
            setIsProcessing(false); // Para o indicador de processamento
            resolve(processedUrl);
          };

          // Iniciar a gravação do canvas com intervalo menor para capturar mais frames
          mediaRecorder.start(100); // Captura dados a cada 100ms para melhor qualidade

          // Iniciar a reprodução do vídeo
          video.play();
        };

        // Processar cada frame do vídeo
        video.ontimeupdate = () => {
          // Limpar o canvas antes de desenhar o novo frame
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Desenhar o frame atual no canvas com alta qualidade
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Adicionar texto (mesmo estilo da foto)
          const timestamp = new Date().toLocaleString();
          const appName = "BadalaCam";

          // Configuração do texto do timestamp (topo)
          ctx.font = "bold 32px Arial";
          const textWidth = ctx.measureText(timestamp).width;
          const paddingX = 20;
          const radius = 8;

          // Função para desenhar retângulo com cantos arredondados
          const drawRoundedRect = (
            x: number,
            y: number,
            width: number,
            height: number,
            radius: number
          ) => {
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(
              x + width,
              y + height,
              x + width - radius,
              y + height
            );
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
            ctx.fill();
          };

          // Fundo preto para o timestamp (topo)
          ctx.fillStyle = "black";
          drawRoundedRect(5, 5, textWidth + paddingX * 2, 40, radius);

          // Texto do timestamp
          ctx.fillStyle = "white";
          ctx.fillText(timestamp, 5 + paddingX, 35);

          // Configuração do texto do BadalaCam (parte inferior)
          ctx.font = "bold 24px Arial";
          const appNameWidth = ctx.measureText(appName).width;
          const bottomPadding = 20;
          const appNameHeight = 35;
          const bottomY = canvas.height - appNameHeight - bottomPadding;

          // Fundo preto para o BadalaCam
          ctx.fillStyle = "black";
          drawRoundedRect(
            5,
            bottomY,
            appNameWidth + paddingX * 2,
            appNameHeight,
            radius
          );

          // Texto do BadalaCam
          ctx.fillStyle = "white";
          ctx.fillText(appName, 5 + paddingX, bottomY + 25);
        };

        // Quando o vídeo terminar, parar a gravação
        video.onended = () => {
          if (mediaRecorder && mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
          }
        };

        // Em caso de erro
        video.onerror = (error) => {
          setIsProcessing(false); // Para o indicador de processamento em caso de erro
          reject(new Error(`Erro ao processar o vídeo: ${error}`));
        };
      } catch (error) {
        setIsProcessing(false); // Para o indicador de processamento em caso de erro
        reject(error);
      }
    });
  };

  // Inicia a gravação (9 segundos)
  const startRecording = async () => {
    if (!stream) return;

    // Configurar o MediaRecorder com alta qualidade
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp9",
      videoBitsPerSecond: 8000000, // 8 Mbps para alta qualidade
    });
    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = (e) => {
      chunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunks, { type: "video/webm" });

      // Processa o vídeo com Canvas
      try {
        const processedVideoUrl = await processVideoWithCanvas(blob);
        setRecordedVideo(processedVideoUrl);
      } catch (err) {
        console.error("Erro ao processar vídeo:", err);
        // Fallback para o vídeo original se o processamento falhar
        const videoUrl = URL.createObjectURL(blob);
        setRecordedVideo(videoUrl);
        setIsProcessing(false); // Garantir que o indicador de processamento seja desativado
      }

      // Desativa a câmera após gravar o vídeo
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
        setIsCameraActive(false);
        setStopedCamera(true);
      }

      setIsRecording(false);
      setCountdown(9); // Reseta o contador
    };

    // Iniciar a gravação com intervalo menor para capturar mais frames
    mediaRecorder.start(100); // Captura dados a cada 100ms para melhor qualidade
    setRecorder(mediaRecorder);
    setIsRecording(true);
    setCountdown(9);

    // Contagem regressiva de 9s
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (mediaRecorder.state === "recording") {
            mediaRecorder.stop();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Garantir que a gravação pare após 9 segundos
    setTimeout(() => {
      if (mediaRecorder.state === "recording") {
        mediaRecorder.stop();
      }
    }, 9000);
  };

  // Para a gravação manualmente
  const stopRecording = () => {
    if (recorder && isRecording) {
      recorder.stop();
      stream?.getTracks().forEach((track) => track.stop()); // Para a câmera após gravar
    }
  };

  // Download do vídeo
  const downloadVideo = () => {
    if (!recordedVideo) return;
    const link = document.createElement("a");
    link.download = `video-${new Date().toISOString()}.webm`;
    link.href = recordedVideo;
    link.click();
  };

  // Para a câmera ao sair do componente
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="flex flex-col gap-4 items-center justify-center px-4">
      {!isCameraActive && stopedCamera && (
        <span className="text-zinc-800 font-bold text-lg">
          Inicie a câmera para registrar o horário
        </span>
      )}

      {/* Container da câmera com texto sobreposto */}
      {isCameraActive && (
        <div className="relative w-full">
          {!recordedVideo && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: "100%",
                transform: useFrontCamera ? "scaleX(-1)" : "none", // Espelha a câmera frontal
              }}
            ></video>
          )}

          {/* Texto sobreposto */}
          <div
            ref={textOverlayRef}
            className="absolute bottom-5 left-3 text-white bg-black bg-opacity-50 p-2 text-base font-bold rounded"
          >
            {currentTime}
          </div>
        </div>
      )}

      {/* Canvas para captura */}

      <canvas ref={canvasRef} style={{ display: "none" }}></canvas>

      {/* Contagem regressiva */}
      {isRecording && (
        <div className="text-red-600 font-bold text-xl">
          Tempo restante: {countdown}s
        </div>
      )}

      {/* Indicador de processamento do vídeo */}
      {isProcessing && (
        <div className="flex flex-col items-center justify-center p-4 bg-zinc-100 rounded-lg shadow-md">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-zinc-900 mb-2"></div>
          <p className="text-zinc-800 font-bold text-lg">
            Gerando vídeo seguro
          </p>
        </div>
      )}

      {/* Botões */}
      <div className="flex flex-col gap-4">
        {!isCameraActive && (
          <button
            className="bg-zinc-900 text-zinc-50 p-2 rounded-md flex items-center gap-2 justify-center"
            onClick={startCamera}
          >
            <FaPlay />
            Iniciar Câmera
          </button>
        )}

        {isCameraActive && (
          <button
            className="bg-blue-900 text-zinc-50 p-2 rounded-md flex items-center gap-2 justify-center"
            onClick={toggleCamera}
          >
            <FaSync />
            Alternar para {useFrontCamera ? "Traseira" : "Frontal"}
          </button>
        )}

        {isCameraActive && (
          <button
            className="bg-zinc-900 text-zinc-50 p-2 rounded-md flex items-center gap-2 justify-center"
            onClick={startRecording}
            disabled={!stream || isRecording}
          >
            <FaVideo />
            Gravar Vídeo (9s)
          </button>
        )}

        {isRecording && (
          <button
            className="bg-red-600 text-zinc-50 p-2 rounded-md flex items-center gap-2 justify-center"
            onClick={stopRecording}
          >
            <FaStop />
            Parar Antes do Tempo
          </button>
        )}

        {recordedVideo && (
          <>
            <div className="flex flex-col gap-4 px-4">
              <h3>Prévia do Vídeo:</h3>
              <video
                src={recordedVideo}
                controls
                muted={isProcessing}
                style={{ width: "100%" }}
              />
              <button
                className="bg-zinc-900 text-zinc-50 p-2 rounded-md flex items-center gap-2 justify-center hover:bg-zinc-800 mb-20 h-20"
                onClick={downloadVideo}
              >
                <FaDownload />
                Baixar Vídeo
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
