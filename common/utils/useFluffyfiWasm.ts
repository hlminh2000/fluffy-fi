import { memoize } from 'lodash';
import { useEffect, useState } from 'react'
import initWasm, * as fluffyWasm from '~fluffyfi-rust/pkg'
import omit from 'lodash/omit';

const init = memoize(() => initWasm());

export const useFluffyfiWasm = () => {
  const [wasmLib, setWasmLib] = useState<fluffyWasm.InitOutput>();
  useEffect(() => {
    init().then(setWasmLib)
  }, [])
  return {
    initialized: !! wasmLib,
    ...omit(fluffyWasm, "default", "initSync")
  }
}
