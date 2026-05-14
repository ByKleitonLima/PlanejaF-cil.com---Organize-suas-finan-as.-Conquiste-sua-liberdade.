function checkDevice() {
    const main = document.querySelector('main');
    let blocker = document.getElementById('mobile-blocker');

    if (window.innerWidth > 480) {
        if (main) main.style.display = 'none';

        if (!blocker) {
            blocker = document.createElement('div');
            blocker.id = 'mobile-blocker';
            blocker.style.cssText = `
                width: 100vw;
                height: 100vh;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                background-color: #F9FBF9;
                font-family: sans-serif;
                gap: 16px;
                text-align: center;
                padding: 20px;
                box-sizing: border-box;
                position: fixed;
                top: 0; left: 0;
                z-index: 99999;
            `;
            blocker.innerHTML = `
                <div style="
                    width: 64px;
                    height: 64px;
                    border: 3px solid #2D2D2D;
                    border-radius: 14px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    font-size: 28px;
                ">📱</div>
                <h1 style="font-size: 18px; color: #2D2D2D; margin: 0; font-weight: bold;">
                    Acesso apenas mobile
                </h1>
                <p style="font-size: 14px; color: #676767; margin: 0; max-width: 300px;">
                    Esta aplicação foi desenvolvida para dispositivos móveis.
                    Acesse pelo seu celular ou reduza a janela do navegador.
                </p>
            `;
            document.body.appendChild(blocker);
        }
    } else {
        if (main) main.style.display = '';
        if (blocker) blocker.remove();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkDevice();
    window.addEventListener('resize', checkDevice);
});
