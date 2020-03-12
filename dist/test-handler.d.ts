export declare let DecorationsState: {
    pipeCalled: boolean;
    guardCaled: boolean;
    interceptorCalled: boolean;
    serviceConstructorCount: number;
    interceptorConstructorCount: number;
};
export declare function resetDecorationsState(): void;
export declare class TestService {
    constructor();
    invoke(params: any): Promise<any>;
}
