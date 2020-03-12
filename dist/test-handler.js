"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const _1 = require(".");
const initialModuleState = {
    pipeCalled: false,
    guardCaled: false,
    interceptorCalled: false,
    serviceConstructorCount: 0,
    interceptorConstructorCount: 0
};
exports.DecorationsState = Object.assign({}, initialModuleState);
function resetDecorationsState() {
    console.log("Reset count");
    Object.assign(exports.DecorationsState, initialModuleState);
}
exports.resetDecorationsState = resetDecorationsState;
let TestPipe = class TestPipe {
    transform(value, metadata) {
        exports.DecorationsState.pipeCalled = true;
        return value;
    }
};
TestPipe = __decorate([
    common_1.Injectable()
], TestPipe);
let TestInterceptor = class TestInterceptor {
    constructor() {
        exports.DecorationsState.interceptorConstructorCount++;
    }
    intercept(context, next) {
        exports.DecorationsState.interceptorCalled = true;
        return next.handle();
    }
};
TestInterceptor = __decorate([
    common_1.Injectable({ scope: common_1.Scope.REQUEST }),
    __metadata("design:paramtypes", [])
], TestInterceptor);
let TestGuard = class TestGuard {
    canActivate(context) {
        exports.DecorationsState.guardCaled = true;
        return true;
    }
};
TestGuard = __decorate([
    common_1.Injectable()
], TestGuard);
let TestService = class TestService {
    constructor() {
        exports.DecorationsState.serviceConstructorCount = exports.DecorationsState.serviceConstructorCount + 1;
        console.log("TestService count now at", exports.DecorationsState.serviceConstructorCount);
    }
    async invoke(params) {
        console.log("Invoke WAS called");
        return params;
    }
};
__decorate([
    common_1.UsePipes(TestPipe),
    common_1.UseInterceptors(TestInterceptor),
    common_1.UseGuards(TestGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TestService.prototype, "invoke", null);
TestService = __decorate([
    _1.JSONRpcService({
        namespace: "test"
    }),
    __metadata("design:paramtypes", [])
], TestService);
exports.TestService = TestService;
//# sourceMappingURL=test-handler.js.map