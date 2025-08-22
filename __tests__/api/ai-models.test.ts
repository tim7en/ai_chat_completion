import { aiModels, getModelById, getModelsByCategory, getPopularModels } from '@/lib/ai-models'

describe('AI Models Library', () => {
  describe('aiModels array', () => {
    it('should contain all expected models', () => {
      expect(aiModels).toHaveLength(6)
      
      const modelIds = aiModels.map(model => model.id)
      expect(modelIds).toContain('gpt-3.5-turbo')
      expect(modelIds).toContain('gpt-4')
      expect(modelIds).toContain('gpt-4-turbo')
      expect(modelIds).toContain('claude-3-opus')
      expect(modelIds).toContain('claude-3-sonnet')
      expect(modelIds).toContain('gemini-pro')
    })

    it('should have proper structure for each model', () => {
      aiModels.forEach(model => {
        expect(model).toHaveProperty('id')
        expect(model).toHaveProperty('name')
        expect(model).toHaveProperty('description')
        expect(model).toHaveProperty('creditsPerMessage')
        expect(model).toHaveProperty('maxTokens')
        expect(model).toHaveProperty('features')
        expect(model).toHaveProperty('category')
        expect(model).toHaveProperty('color')
        
        expect(typeof model.id).toBe('string')
        expect(typeof model.name).toBe('string')
        expect(typeof model.description).toBe('string')
        expect(typeof model.creditsPerMessage).toBe('number')
        expect(typeof model.maxTokens).toBe('number')
        expect(Array.isArray(model.features)).toBe(true)
        expect(['basic', 'advanced', 'premium']).toContain(model.category)
        expect(typeof model.color).toBe('string')
      })
    })

    it('should have reasonable credit costs', () => {
      aiModels.forEach(model => {
        expect(model.creditsPerMessage).toBeGreaterThan(0)
        expect(model.creditsPerMessage).toBeLessThanOrEqual(10) // Reasonable max
        expect(model.maxTokens).toBeGreaterThan(1000) // Minimum reasonable tokens
      })
    })
  })

  describe('getModelById', () => {
    it('should return correct model for valid ID', () => {
      const gpt35 = getModelById('gpt-3.5-turbo')
      expect(gpt35).toBeDefined()
      expect(gpt35?.id).toBe('gpt-3.5-turbo')
      expect(gpt35?.name).toBe('GPT-3.5 Turbo')
      expect(gpt35?.creditsPerMessage).toBe(1)
      expect(gpt35?.category).toBe('basic')

      const gpt4 = getModelById('gpt-4')
      expect(gpt4).toBeDefined()
      expect(gpt4?.id).toBe('gpt-4')
      expect(gpt4?.name).toBe('GPT-4')
      expect(gpt4?.creditsPerMessage).toBe(3)
      expect(gpt4?.category).toBe('advanced')
      expect(gpt4?.popular).toBe(true)

      const claude = getModelById('claude-3-opus')
      expect(claude).toBeDefined()
      expect(claude?.id).toBe('claude-3-opus')
      expect(claude?.name).toBe('Claude 3 Opus')
      expect(claude?.creditsPerMessage).toBe(5)
      expect(claude?.category).toBe('premium')
    })

    it('should return undefined for invalid ID', () => {
      const invalidModel = getModelById('invalid-model')
      expect(invalidModel).toBeUndefined()

      const emptyModel = getModelById('')
      expect(emptyModel).toBeUndefined()
    })

    it('should handle case sensitivity', () => {
      const upperCase = getModelById('GPT-3.5-TURBO')
      expect(upperCase).toBeUndefined() // Should be case sensitive

      const mixedCase = getModelById('Gpt-3.5-Turbo')
      expect(mixedCase).toBeUndefined() // Should be case sensitive
    })
  })

  describe('getModelsByCategory', () => {
    it('should return correct models for basic category', () => {
      const basicModels = getModelsByCategory('basic')
      expect(basicModels).toHaveLength(1)
      expect(basicModels[0].id).toBe('gpt-3.5-turbo')
      expect(basicModels[0].category).toBe('basic')
    })

    it('should return correct models for advanced category', () => {
      const advancedModels = getModelsByCategory('advanced')
      expect(advancedModels.length).toBeGreaterThan(0)
      
      advancedModels.forEach(model => {
        expect(model.category).toBe('advanced')
      })

      const modelIds = advancedModels.map(m => m.id)
      expect(modelIds).toContain('gpt-4')
      expect(modelIds).toContain('gpt-4-turbo')
      expect(modelIds).toContain('claude-3-sonnet')
      expect(modelIds).toContain('gemini-pro')
    })

    it('should return correct models for premium category', () => {
      const premiumModels = getModelsByCategory('premium')
      expect(premiumModels).toHaveLength(1)
      expect(premiumModels[0].id).toBe('claude-3-opus')
      expect(premiumModels[0].category).toBe('premium')
      expect(premiumModels[0].creditsPerMessage).toBe(5) // Most expensive
    })

    it('should return empty array for invalid category', () => {
      // @ts-ignore - Testing invalid category
      const invalidCategory = getModelsByCategory('invalid')
      expect(invalidCategory).toEqual([])
    })
  })

  describe('getPopularModels', () => {
    it('should return only models marked as popular', () => {
      const popularModels = getPopularModels()
      expect(popularModels.length).toBeGreaterThan(0)
      
      popularModels.forEach(model => {
        expect(model.popular).toBe(true)
      })

      // GPT-4 should be marked as popular
      const gpt4Popular = popularModels.find(m => m.id === 'gpt-4')
      expect(gpt4Popular).toBeDefined()
    })

    it('should not include non-popular models', () => {
      const popularModels = getPopularModels()
      const allPopularIds = popularModels.map(m => m.id)
      
      // GPT-3.5 should not be popular
      expect(allPopularIds).not.toContain('gpt-3.5-turbo')
    })
  })

  describe('Model pricing and features validation', () => {
    it('should have correct pricing tiers', () => {
      const basicModel = getModelById('gpt-3.5-turbo')
      const advancedModel = getModelById('gpt-4')
      const premiumModel = getModelById('claude-3-opus')

      expect(basicModel?.creditsPerMessage).toBeLessThan(advancedModel?.creditsPerMessage || 0)
      expect(advancedModel?.creditsPerMessage).toBeLessThan(premiumModel?.creditsPerMessage || 0)
    })

    it('should have reasonable token limits', () => {
      const claude = getModelById('claude-3-opus')
      expect(claude?.maxTokens).toBeGreaterThan(100000) // Large context

      const gpt35 = getModelById('gpt-3.5-turbo')
      expect(gpt35?.maxTokens).toBeGreaterThanOrEqual(4096) // Standard context
    })

    it('should have meaningful features for each model', () => {
      aiModels.forEach(model => {
        expect(model.features.length).toBeGreaterThan(0)
        model.features.forEach(feature => {
          expect(typeof feature).toBe('string')
          expect(feature.length).toBeGreaterThan(0)
        })
      })
    })

    it('should have unique model IDs', () => {
      const modelIds = aiModels.map(model => model.id)
      const uniqueIds = [...new Set(modelIds)]
      expect(modelIds.length).toBe(uniqueIds.length)
    })

    it('should have proper color assignments', () => {
      const validColors = ['blue', 'purple', 'indigo', 'orange', 'yellow', 'green']
      
      aiModels.forEach(model => {
        expect(validColors).toContain(model.color)
      })
    })
  })

  describe('Edge cases and error handling', () => {
    it('should handle null and undefined inputs gracefully', () => {
      // @ts-ignore - Testing with null
      expect(getModelById(null)).toBeUndefined()
      
      // @ts-ignore - Testing with undefined  
      expect(getModelById(undefined)).toBeUndefined()
    })

    it('should maintain consistent model structure', () => {
      // Ensure all models have the same required properties
      const requiredProps = ['id', 'name', 'description', 'creditsPerMessage', 'maxTokens', 'features', 'category', 'color']
      
      aiModels.forEach((model, index) => {
        requiredProps.forEach(prop => {
          expect(model).toHaveProperty(prop)
        })
      })
    })
  })
})