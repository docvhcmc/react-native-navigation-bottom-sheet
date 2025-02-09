import {
  Navigation,
  Layout,
  OptionsModalPresentationStyle,
  Options,
} from 'react-native-navigation';

import { listen, dispatch } from './events';
import type { RNNBottomSheetProps } from './types';

import BottomSheet from './BottomSheet';
import type { ComponentProvider } from 'react-native';

const notInitialized = 'You have not initialized RNNBottomSheet component.';
const openedInstance =
  'You already have running instance of the component. Aborting...';

export type { RNNBottomSheetProps }

export default class RNNBottomSheet {
  private static modalOpened = false;
  private static registered = false;
  private static bottomSheetName = '__initBottomSheet__';

  static getComponentName() {
    return this.bottomSheetName;
  }

  static isOpened() {
    return this.modalOpened;
  }

  static init(
    registerWithProvider?: (
      name: string,
      bottomSheet: typeof BottomSheet
    ) => ComponentProvider
  ) {
    if (!this.registered) {
      console.log('===> Registering bottom sheet');

      registerWithProvider
        ? registerWithProvider(this.bottomSheetName, BottomSheet)
        : Navigation.registerComponent(this.bottomSheetName, () => BottomSheet);
      this.registered = true;

      listen('MARK_CLOSED', () => {
        this.modalOpened = false;
      });
    }
  }

  /**
   * Used only to showcase a support for multuple snap points.
   * Probably useless in practise.
   */
  static snapTo(index: number) {
    dispatch('BOTTOM_SHEET_SNAP_TO', index);
  }

  static openBottomSheet(props: RNNBottomSheetProps, options?: Options) {
    if (!this.registered) {
      console.error(notInitialized);
      return;
    }

    if (this.modalOpened) {
      console.error(openedInstance);
      return;
    }

    this.modalOpened = true;

    const layout: Layout<RNNBottomSheetProps> = {
      component: {
        passProps: props,
        name: this.bottomSheetName,
        options: {
          animations: {
            showModal: {
              enabled: false,
            },
            dismissModal: {
              enabled: false,
            },
          },
          layout: {
            backgroundColor: 'transparent',
            componentBackgroundColor: 'transparent',
          },
          hardwareBackButton: {
            dismissModalOnPress: false,
          },
          modal: {
            swipeToDismiss: false,
          },
          popGesture: false,
          modalPresentationStyle:
            'overCurrentContext' as OptionsModalPresentationStyle,
          ...options
        },        
      },
    };
    Navigation.showModal(layout);
  }

  static closeBottomSheet() {
    if (!this.registered) {
      console.error(notInitialized);
      return;
    }

    dispatch('DISMISS_BOTTOM_SHEET');
  }
}
