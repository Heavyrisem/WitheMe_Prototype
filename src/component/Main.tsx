import React, { useEffect, useState, useRef } from 'react';
import '../style/Main.css';

const ENDPOINT = 'withme.heavyrisem.xyz';

function Main() {
	const [Display, setDisplay] = useState<string>();
	const viewRef = useRef<HTMLVideoElement>(null);
	const audioRef = useRef<HTMLAudioElement>(null);

	useEffect(StartRec, []);

	function StartRec() {
		let constraints = { audio: false, video: { width: {ideal: 9999}, height: {ideal: 9999}, facingMode: "environment"} };
		if (!navigator.mediaDevices) return;
		navigator.mediaDevices.getUserMedia(constraints).then(media => {
			if (viewRef.current) {
				viewRef.current.srcObject = media;
				viewRef.current.onloadedmetadata = (e) => {
					if (viewRef.current) viewRef.current.play();
				}
			}
		}).catch(e => {
			console.log(e);
			alert("Err" + e);
		})
	}

	async function Capture() {
		if (viewRef.current && audioRef.current) {
			viewRef.current.pause();
			setDisplay("Loading ...");
			let cv = document.createElement('canvas');
			cv.width = viewRef.current.videoWidth;
			cv.height = viewRef.current.videoHeight;
			cv.getContext('2d')?.drawImage(viewRef.current, 0, 0);

			let data = atob(cv.toDataURL('image/png').split(',')[1]);
			let file = new Blob([new Uint8Array(Buffer.from(data, 'binary'))], {type: 'image/png'})
			let fd = new FormData();
			fd.append("file", file, "image.png");
			
			try {
				let OCR_Response = await fetch(`https://${ENDPOINT}/ocr`, {
					method: "POST",
					headers: {},
					body: fd
				});
	
				let OCR_Result: {result?: string, detail?: string} = await OCR_Response.json();
				if (OCR_Result.result) {
					setDisplay(OCR_Result.result);
					console.log(OCR_Result.result)
					let TTS_Response = await fetch(`https://${ENDPOINT}/tts`, {
						method: "POST",
						body: JSON.stringify({text: OCR_Result.result})
					});
	
					let TTS_Result: {result?: string, detail?: string} = await TTS_Response.json();
					if (TTS_Result.result) {
						audioRef.current.src = "data:audio/mp3;base64,"+TTS_Result.result;
						audioRef.current.play();
					} else {
						setDisplay(TTS_Result.detail);
					}
				}
				else
					setDisplay(OCR_Result.detail);

				viewRef.current.play();
			} catch (e) {
				setDisplay(e);
			}
		}
	}

	return (
		<div className="Comp">
			<video ref={viewRef} playsInline></video>

			<div className="Bottom">

				<div className="row">
					<span className="TextResult">
						{Display}
						<br />
						<audio playsInline controls ref={audioRef} />
					</span>
				</div>

				<div className="row">
					<div className="Shutter" onClick={Capture}>
						<div className="ShutterBall"></div>
					</div>
				</div>


			</div>

		</div>
	);
}

export default Main;
