import { create } from 'zustand'


// 弹窗对象类型
type ModalStack = {
  id: string;
  closeHandler: () => void;
};

type GeneralStore = {
  generateId: () => string
	stack: ModalStack[]
	pushStack: (item: ModalStack) => void
	removeStack: (id: string) => void
  closeTopStack: () => void
  stackCount: () => number
}

// 生成唯一ID
const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * 弹窗关闭方法堆栈管理器(无需持久化)
 */
export const useStackStore = create<GeneralStore>()((set, get) => ({
  generateId,
	stack: [],
	// 添加新消息
  pushStack: (item) => {
    set((state) => ({
      stack: [...state.stack, item]
    }));
	},
  removeStack: (id: string) => {
		set((state) => ({
			stack: state.stack.filter(e => e.id !== id)
		}))
	},
  closeTopStack: () => {
    const { stack } = get();
    if (stack.length === 0) return;
    
    // 获取最后一个弹窗（最近打开的）
    const lastModal = stack[stack.length - 1];
    
    // 执行关闭函数
    if (lastModal.closeHandler) {
      lastModal.closeHandler();
    }
    // 从堆栈中移除
    set({ stack: stack.slice(0, -1) });
	},
  stackCount: () => get().stack.length
}))
