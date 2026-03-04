/** @type {import("@minecraft/server").BlockCustomComponent} */
export const kadoNetherrack = {
        onTick(eventData) {
                const { block, dimension } = eventData;
                dimension.setBlockType(block.location, "minecraft:netherrack")
        }
};
