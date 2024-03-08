import "../styles/globals.css";
import type { AppProps } from "next/app";
import { AuthContextProvider } from "../context/authcontext";
import { Toaster } from "react-hot-toast";
import { useRouter } from "next/router";
import TutorialsWrapper from "../components/Tutorials/TutorialsWrapper";
import { useEffect } from "react";

import { createConfig, configureChains, WagmiConfig } from "wagmi";
import { publicProvider } from "wagmi/providers/public";
import { SessionProvider } from "next-auth/react";
import { mainnet } from "wagmi/chains";

const { publicClient, webSocketPublicClient } = configureChains(
  [mainnet],
  [publicProvider()]
);

const config = createConfig({
  autoConnect: true,
  publicClient,
  webSocketPublicClient,
});

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('../firebase-messaging-sw.js')
        .then((registration) => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  if (
    router.asPath == "/" ||
    router.asPath == "/signup" ||
    router.asPath == "/forgot-password" ||
    router.asPath == "/login" ||
    router.asPath == "/reset-password"
  ) {
    return (
      <>
        <AuthContextProvider>
          <WagmiConfig config={config}>
            <SessionProvider session={pageProps.session} refetchInterval={0}>
              <Component {...pageProps} />
            </SessionProvider>
          </WagmiConfig>
        </AuthContextProvider>
        <Toaster />
      </> 
    );
  } else {
    return (
      <>
        <AuthContextProvider>
          {/* <HeaderMobile /> */}
          <TutorialsWrapper>
            <WagmiConfig config={config}>
              <SessionProvider session={pageProps.session} refetchInterval={0}>
                <Component {...pageProps} />
              </SessionProvider>
            </WagmiConfig>
          </TutorialsWrapper>
        </AuthContextProvider >
        <Toaster />
      </>
    );
  }
}

export default MyApp;
